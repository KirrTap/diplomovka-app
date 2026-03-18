import type { LogicToken } from "./tokenizer";

export type ASTNode =
  | {
      type: "BinaryExpression";
      operator: "implies" | "and" | "or";
      left: ASTNode;
      right: ASTNode;
    }
  | { type: "UnaryExpression"; operator: "not"; operand: ASTNode }
  | {
      type: "Quantifier";
      symbol: "forall" | "exists";
      variable: string;
      formula: ASTNode;
    }
  | { type: "Predicate"; name: string; args: ASTNode[] }
  | { type: "Constant"; name: string }
  | { type: "Variable"; name: string }
  | { type: "Function"; name: string; args: ASTNode[] };

export function parseStandardFormula(tokens: LogicToken[]): ASTNode {
  const hasLogicalOperator = tokens.some(
    (t) => t.type === "and" || t.type === "or" || t.type === "implies"
  );
  if (!hasLogicalOperator) {
    throw new Error("errors.error_no_binary_connective");
  }

  let pos = 0;
  function peek(): LogicToken {
    return tokens[pos];
  }

  function getSymbolFromType(type: LogicToken["type"]): string {
    switch (type) {
      case "and": return "∧";
      case "or": return "∨";
      case "implies": return "=>";
      case "not": return "¬";
      case "forall": return "∀";
      case "exists": return "∃";
      default: return type;
    }
  }

  function eat(type: LogicToken["type"]): void {
    if (tokens[pos].type === type) pos++;
    else {
      throw new Error(`errors.error_unexpected_token|${getSymbolFromType(tokens[pos].type)}`);
    }
  }

  function parseExpression(): ASTNode {
    return parseImplication();
  }

  function parseImplication(): ASTNode {
    let node = parseDisjunction();
    while (peek().type === "implies") {
      const op = peek().type;
      eat("implies");
      if (
        peek().type === "eof" ||
        peek().type === "rparen" ||
        peek().type === "comma"
      ) {
        throw new Error(`errors.error_missing_right_side|${getSymbolFromType(op)}`);
      }
      const right = parseImplication();
      node = {
        type: "BinaryExpression",
        operator: "implies",
        left: node,
        right,
      };
    }
    return node;
  }

  function parseDisjunction(): ASTNode {
    let node = parseConjunction();
    while (peek().type === "or") {
      const op = peek().type;
      eat("or");
      if (
        peek().type === "eof" ||
        peek().type === "rparen" ||
        peek().type === "comma"
      ) {
        throw new Error(`errors.error_missing_right_side|${getSymbolFromType(op)}`);
      }
      const right = parseDisjunction();
      node = { type: "BinaryExpression", operator: "or", left: node, right };
    }
    return node;
  }

  function parseConjunction(): ASTNode {
    if (
      peek().type === "and" ||
      peek().type === "or" ||
      peek().type === "implies"
    ) {
      throw new Error(`errors.error_missing_left_side|${getSymbolFromType(peek().type)}`);
    }
    let node = parseNegation();
    while (peek().type === "and") {
      const op = peek().type;
      eat("and");
      if (
        peek().type === "eof" ||
        peek().type === "rparen" ||
        peek().type === "comma"
      ) {
        throw new Error(`errors.error_missing_right_side|${getSymbolFromType(op)}`);
      }
      const right = parseConjunction();
      node = { type: "BinaryExpression", operator: "and", left: node, right };
    }
    return node;
  }

  function parseNegation(): ASTNode {
    if (peek().type === "not") {
      const op = peek().type;
      eat("not");
      if (
        peek().type === "eof" ||
        peek().type === "rparen" ||
        peek().type === "comma"
      ) {
        throw new Error(`errors.error_missing_right_side|${getSymbolFromType(op)}`);
      }
      const operand = parseNegation();
      return { type: "UnaryExpression", operator: "not", operand };
    }
    return parseQuantifier();
  }

  function parseQuantifier(): ASTNode {
    const current = peek();
    
    // Ak nájdeme kvantifikátor bez zátvorky, je to chyba
    if (current.type === "forall" || current.type === "exists") {
      throw new Error("errors.error_invalid_quantifier_format");
    }

    if (current.type === "lparen") {
      const next = tokens[pos + 1];
      if (next && (next.type === "forall" || next.type === "exists")) {
        // Musí to byť presne (∀x)Formula, nič iné neakceptujeme
        eat("lparen");
        const symbol = peek().type as "forall" | "exists";
        eat(symbol);
        
        if (peek().type !== "lower_id") throw new Error("errors.quantifier_variable_missing");
        const variable = (peek() as any).value;
        eat("lower_id");
        
        // Ak nenasleduje pravá zátvorka hneď po premennej (teda napr. (∀x Formula)), je to chyba
        if (peek().type !== "rparen") {
          throw new Error("errors.error_invalid_quantifier_format");
        }
        eat("rparen");
        
        if (peek().type === "comma") {
          throw new Error("errors.error_unexpected_comma");
        }

        if (
          peek().type === "eof" ||
          peek().type === "rparen" ||
          peek().type === "comma"
        ) {
          throw new Error(`errors.error_missing_right_side|${getSymbolFromType(symbol)}`);
        }
        
        const formula = parseNegation(); // Kvantifikátor sa viaže rovnako silno ako negácia / hneď na ďalší výraz
        return { type: "Quantifier", symbol, variable, formula };
      }
    }
    return parseAtom();
  }

  function parseAtom(): ASTNode {
    if (peek().type === "lparen") {
      eat("lparen");
      const node = parseExpression();
      if (peek().type !== "rparen") throw new Error("errors.error_parentheses");
      eat("rparen");
      return node;
    }

    if (peek().type === "rparen") {
      throw new Error("errors.error_parentheses");
    }

    if (peek().type === "lower_id") {
      const name = (peek() as any).value;
      throw new Error(`errors.error_unexpected_variable|${name}`);
    }

    if (peek().type === "comma") {
      throw new Error("errors.error_unexpected_comma");
    }

    if (peek().type === "upper_id") {
      const name = (peek() as any).value;
      eat("upper_id");
      const args: ASTNode[] = [];
      if (peek().type === "lparen") {
        eat("lparen");
        if (peek().type === "rparen") {
          throw new Error("errors.error_empty_arguments");
        }
        while (peek().type === "upper_id" || peek().type === "lower_id") {
          args.push(parseTerm());
          if (peek().type === "comma") {
            eat("comma");
            if (peek().type === "rparen") {
              throw new Error("errors.error_unexpected_comma");
            }
          }
        }

        const nextType = peek().type;
        if (nextType === "comma") {
          throw new Error("errors.error_unexpected_comma");
        }
        if (
          nextType === "and" ||
          nextType === "or" ||
          nextType === "implies" ||
          nextType === "not"
        ) {
          throw new Error(`errors.error_operator_inside_arguments|${getSymbolFromType(nextType)}`);
        }

        if (peek().type !== "rparen") {
          throw new Error("errors.error_parentheses");
        }
        eat("rparen");
      }
      return { type: "Predicate", name, args };
    }

    const currentType = peek().type;
    if (
      currentType === "implies" ||
      currentType === "and" ||
      currentType === "or"
    ) {
      throw new Error(`errors.error_unexpected_token|${getSymbolFromType(currentType)}`);
    }

    if (currentType === "comma") {
      throw new Error("errors.error_unexpected_comma");
    }

    throw new Error(`errors.error_unexpected_token|${getSymbolFromType(currentType)}`);
  }

  function parseTerm(): ASTNode {
    const type = peek().type;
    if (type === "comma") {
      throw new Error("errors.error_unexpected_comma");
    }
    if (
      type === "and" ||
      type === "or" ||
      type === "implies" ||
      type === "not"
    ) {
      throw new Error(`errors.error_operator_inside_arguments|${getSymbolFromType(type)}`);
    }

    if (peek().type === "upper_id") {
      const name = (peek() as any).value;
      eat("upper_id");
      if (peek().type === "lparen") {
        throw new Error(`errors.error_predicate_as_argument|${name}`);
      }
      return { type: "Constant", name };
    }

    if (peek().type === "lower_id") {
      const name = (peek() as any).value;
      eat("lower_id");
      if (peek().type === "lparen") {
        eat("lparen");
        if (peek().type === "rparen") {
          throw new Error("errors.error_empty_arguments");
        }
        const args: ASTNode[] = [];
        while (peek().type === "upper_id" || peek().type === "lower_id") {
          args.push(parseTerm());
          if (peek().type === "comma") {
            eat("comma");
            if (peek().type === "rparen") {
              throw new Error("errors.error_unexpected_comma");
            }
          }
        }

        const nextType = peek().type;
        if (nextType === "comma") {
          throw new Error("errors.error_unexpected_comma");
        }
        if (
          nextType === "and" ||
          nextType === "or" ||
          nextType === "implies" ||
          nextType === "not"
        ) {
          throw new Error(`errors.error_operator_inside_arguments|${getSymbolFromType(nextType)}`);
        }

        if (peek().type !== "rparen") {
          throw new Error("errors.error_parentheses");
        }
        eat("rparen");
        return { type: "Function", name, args };
      }
      return { type: "Variable", name };
    }
    throw new Error(`errors.error_expected_term|${getSymbolFromType(peek().type)}`);
  }

  // Start
  const ast = parseExpression();

  if (peek().type !== "eof") {
    if (peek().type === "comma") {
      throw new Error("errors.error_unexpected_comma");
    }
    // Ak sme vyparsovali výraz a stále nám niečo ostalo, narazili sme na token, ktorý tam nepatrí
    throw new Error(`errors.error_unexpected_token|${getSymbolFromType(peek().type)}`);
  }

  return ast;
}

export function stringifyAST(
  node: ASTNode,
  parentType?: ASTNode["type"],
): string {
  const result = stringifyRecursive(node, parentType);
  if (!parentType && result.startsWith("(") && result.endsWith(")")) {
    let depth = 0;
    let match = true;
    for (let i = 0; i < result.length; i++) {
      if (result[i] === "(") depth++;
      else if (result[i] === ")") depth--;
      if (depth === 0 && i < result.length - 1) {
        match = false;
        break;
      }
    }
    if (match) return result.slice(1, -1);
  }
  return result;
}

function stringifyRecursive(
  node: ASTNode,
  parentType?: ASTNode["type"],
): string {
  switch (node.type) {
    case "BinaryExpression": {
      const ops = { and: "∧", or: "∨", implies: "=>" };
      const leftStr = stringifyRecursive(node.left, "BinaryExpression");
      const rightStr = stringifyRecursive(node.right, "BinaryExpression");
      return `(${leftStr} ${ops[node.operator]} ${rightStr})`;
    }
    case "UnaryExpression": {
      const operandStr = stringifyRecursive(node.operand, "UnaryExpression");
      if (node.operand.type === "UnaryExpression") {
        return `¬(${operandStr})`;
      }
      return `¬${operandStr}`;
    }
    case "Quantifier": {
      const syms = { forall: "∀", exists: "∃" };
      const formulaStr = stringifyRecursive(node.formula, "Quantifier");
      const result = `(${syms[node.symbol]}${node.variable})${formulaStr}`;

      if (parentType === "BinaryExpression") {
        return `(${result})`;
      }

      if (
        !parentType &&
        (node.formula.type === "BinaryExpression" ||
          node.formula.type === "Quantifier")
      ) {
        return `(${result})`;
      }

      return result;
    }
    case "Predicate":
      return node.args.length > 0
        ? `${node.name}(${node.args.map((arg) => stringifyRecursive(arg)).join(",")})`
        : node.name;
    case "Function":
      return `${node.name}(${node.args.map((arg) => stringifyRecursive(arg)).join(",")})`;
    case "Constant":
    case "Variable":
      return node.name;
    default:
      return "";
  }
}

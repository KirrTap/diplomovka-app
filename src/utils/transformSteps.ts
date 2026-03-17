import {
  type ASTNode,
  stringifyAST,
  parseStandardFormula,
} from "./parserStandard";
import { logicTokenize } from "./tokenizer";

// --- CORE TRANSFORMATIONS (AST → AST) ---

// 1. Negácia formule
export function negateFormula(ast: ASTNode): ASTNode {
  return {
    type: "UnaryExpression",
    operator: "not",
    operand: ast,
  };
}

// 2. Odstránenie implikácií
export function replaceImplies(node: ASTNode): ASTNode {
  switch (node.type) {
    case "BinaryExpression":
      if (node.operator === "implies") {
        const left = replaceImplies(node.left);
        const right = replaceImplies(node.right);
        if (left.type === "UnaryExpression" && left.operator === "not") {
          return {
            type: "BinaryExpression",
            operator: "or",
            left: left.operand,
            right: right,
          };
        }
        return {
          type: "BinaryExpression",
          operator: "or",
          left: {
            type: "UnaryExpression",
            operator: "not",
            operand: left,
          },
          right: right,
        };
      }
      return {
        ...node,
        left: replaceImplies(node.left),
        right: replaceImplies(node.right),
      };
    case "UnaryExpression":
      return {
        ...node,
        operand: replaceImplies(node.operand),
      };
    case "Quantifier":
      return {
        ...node,
        formula: replaceImplies(node.formula),
      };
    default:
      return node;
  }
}

// 3. Negatívna normálna forma (NNF)
export function toNNF(node: ASTNode, negated: boolean = false): ASTNode {
  if (negated) {
    switch (node.type) {
      case "BinaryExpression":
        if (node.operator === "and") {
          return {
            type: "BinaryExpression",
            operator: "or",
            left: toNNF(node.left, true),
            right: toNNF(node.right, true),
          };
        } else {
          return {
            type: "BinaryExpression",
            operator: "and",
            left: toNNF(node.left, true),
            right: toNNF(node.right, true),
          };
        }
      case "UnaryExpression":
        if (node.operator === "not") {
          return toNNF(node.operand, false);
        }
        break;
      case "Quantifier":
        if (node.symbol === "forall") {
          return {
            type: "Quantifier",
            symbol: "exists",
            variable: node.variable,
            formula: toNNF(node.formula, true),
          };
        } else {
          return {
            type: "Quantifier",
            symbol: "forall",
            variable: node.variable,
            formula: toNNF(node.formula, true),
          };
        }
      case "Predicate":
      case "Function":
      case "Constant":
      case "Variable":
        return { type: "UnaryExpression", operator: "not", operand: node };
    }
  } else {
    switch (node.type) {
      case "BinaryExpression":
        return {
          ...node,
          left: toNNF(node.left, false),
          right: toNNF(node.right, false),
        };
      case "UnaryExpression":
        if (node.operator === "not") {
          return toNNF(node.operand, true);
        }
        return node;
      case "Quantifier":
        return {
          ...node,
          formula: toNNF(node.formula, false),
        };
      default:
        return node;
    }
  }
  return node;
}

// 4. Štandardizácia (unikátne premenné)
export function renameQuantifierVariables(ast: ASTNode): ASTNode {
  const globalUsed: Set<string> = new Set();

  function toSubscript(n: number): string {
    const subscripts = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
    return String(n)
      .split("")
      .map((d) => subscripts[parseInt(d)])
      .join("");
  }

  function getNextVarName(): string {
    if (!globalUsed.has("a")) return "a";
    let idx = 1;
    while (globalUsed.has("a" + toSubscript(idx))) {
      idx++;
    }
    return "a" + toSubscript(idx);
  }

  function traverse(node: ASTNode, replacements: Map<string, string>): ASTNode {
    switch (node.type) {
      case "Quantifier": {
        let newVarName = node.variable;
        if (globalUsed.has(node.variable)) {
          newVarName = getNextVarName();
        }
        globalUsed.add(newVarName);
        const newReplacements = new Map(replacements);
        newReplacements.set(node.variable, newVarName);
        return {
          ...node,
          variable: newVarName,
          formula: traverse(node.formula, newReplacements),
        };
      }
      case "Predicate":
      case "Function":
        return {
          ...node,
          args: node.args.map((arg) => traverse(arg, replacements)),
        };
      case "Variable":
        if (replacements.has(node.name)) {
          return { ...node, name: replacements.get(node.name)! };
        }
        return node;
      case "BinaryExpression":
        return {
          ...node,
          left: traverse(node.left, replacements),
          right: traverse(node.right, replacements),
        };
      case "UnaryExpression":
        return {
          ...node,
          operand: traverse(node.operand, replacements),
        };
      default:
        return node;
    }
  }

  return traverse(ast, new Map());
}

// 5. Prenexná normálna forma (PNF)
export function toPNF(node: ASTNode): ASTNode {
  const quantifiers: { symbol: "forall" | "exists"; variable: string }[] = [];

  function collectAndStrip(n: ASTNode): ASTNode {
    switch (n.type) {
      case "Quantifier":
        quantifiers.push({ symbol: n.symbol, variable: n.variable });
        return collectAndStrip(n.formula);
      case "BinaryExpression":
        return {
          ...n,
          left: collectAndStrip(n.left),
          right: collectAndStrip(n.right),
        };
      case "UnaryExpression":
        return {
          ...n,
          operand: collectAndStrip(n.operand),
        };
      default:
        return n;
    }
  }

  const matrix = collectAndStrip(node);

  const sortedQuantifiers = [...quantifiers].sort((a, b) => {
    if (a.symbol === "exists" && b.symbol === "forall") return -1;
    if (a.symbol === "forall" && b.symbol === "exists") return 1;
    return 0;
  });

  let result = matrix;
  for (let i = sortedQuantifiers.length - 1; i >= 0; i--) {
    result = {
      type: "Quantifier",
      symbol: sortedQuantifiers[i].symbol,
      variable: sortedQuantifiers[i].variable,
      formula: result,
    };
  }

  return result;
}

// 6. Skolemizácia (SNF)
export function skolemize(ast: ASTNode): ASTNode {
  const globalUsed: Set<string> = new Set();

  function toSubscript(n: number): string {
    const subscripts = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
    return String(n)
      .split("")
      .map((d) => subscripts[parseInt(d)])
      .join("");
  }

  function getNextSkolemConstName(): string {
    if (!globalUsed.has("c")) return "c";
    let idx = 1;
    while (globalUsed.has("c" + toSubscript(idx))) {
      idx++;
    }
    return "c" + toSubscript(idx);
  }

  function getNextSkolemFuncName(): string {
    if (!globalUsed.has("f")) return "f";
    let idx = 1;
    while (globalUsed.has("f" + toSubscript(idx))) {
      idx++;
    }
    return "f" + toSubscript(idx);
  }

  function collectNames(node: ASTNode) {
    if (node.type === "Function" || node.type === "Predicate") {
      globalUsed.add(node.name);
      node.args.forEach(collectNames);
    } else if (node.type === "Constant" || node.type === "Variable") {
      globalUsed.add(node.name);
    } else if (node.type === "BinaryExpression") {
      collectNames(node.left);
      collectNames(node.right);
    } else if (node.type === "UnaryExpression") {
      collectNames(node.operand);
    } else if (node.type === "Quantifier") {
      globalUsed.add(node.variable);
      collectNames(node.formula);
    }
  }
  collectNames(ast);

  function transform(
    node: ASTNode,
    universals: string[],
    replacements: Map<string, ASTNode>,
  ): ASTNode {
    switch (node.type) {
      case "Quantifier":
        if (node.symbol === "exists") {
          let replacement: ASTNode;
          if (universals.length === 0) {
            const skolemConst = getNextSkolemConstName();
            globalUsed.add(skolemConst);
            replacement = { type: "Constant", name: skolemConst };
          } else {
            const skolemFunc = getNextSkolemFuncName();
            globalUsed.add(skolemFunc);
            replacement = {
              type: "Function",
              name: skolemFunc,
              args: universals.map((v) => ({ type: "Variable", name: v })),
            };
          }
          const newReplacements = new Map(replacements);
          newReplacements.set(node.variable, replacement);
          return transform(node.formula, universals, newReplacements);
        } else {
          return {
            ...node,
            formula: transform(
              node.formula,
              [...universals, node.variable],
              replacements,
            ),
          };
        }
      case "Variable":
        if (replacements.has(node.name)) {
          return replacements.get(node.name)!;
        }
        return node;
      case "Predicate":
      case "Function":
        return {
          ...node,
          args: node.args.map((arg) =>
            transform(arg, universals, replacements),
          ),
        };
      case "BinaryExpression":
        return {
          ...node,
          left: transform(node.left, universals, replacements),
          right: transform(node.right, universals, replacements),
        };
      case "UnaryExpression":
        return {
          ...node,
          operand: transform(node.operand, universals, replacements),
        };
      default:
        return node;
    }
  }

  return transform(ast, [], new Map());
}

// 7. Vynechanie všeobecných kvantifikátorov
export function removeForallQuantifiers(ast: ASTNode): ASTNode {
  switch (ast.type) {
    case "Quantifier":
      if (ast.symbol === "forall") {
        return removeForallQuantifiers(ast.formula);
      } else {
        return {
          ...ast,
          formula: removeForallQuantifiers(ast.formula),
        };
      }
    case "Predicate":
    case "Function":
      return {
        ...ast,
        args: ast.args.map(removeForallQuantifiers),
      };
    case "BinaryExpression":
      return {
        ...ast,
        left: removeForallQuantifiers(ast.left),
        right: removeForallQuantifiers(ast.right),
      };
    case "UnaryExpression":
      return {
        ...ast,
        operand: removeForallQuantifiers(ast.operand),
      };
    default:
      return ast;
  }
}

// 8. Konjunktívna normálna forma (CNF)
export function toCNF(node: ASTNode): ASTNode {
  switch (node.type) {
    case "BinaryExpression":
      if (node.operator === "and") {
        return {
          type: "BinaryExpression",
          operator: "and",
          left: toCNF(node.left),
          right: toCNF(node.right),
        };
      }
      if (node.operator === "or") {
        const left = toCNF(node.left);
        const right = toCNF(node.right);

        if (left.type === "BinaryExpression" && left.operator === "and") {
          return toCNF({
            type: "BinaryExpression",
            operator: "and",
            left: {
              type: "BinaryExpression",
              operator: "or",
              left: left.left,
              right: right,
            },
            right: {
              type: "BinaryExpression",
              operator: "or",
              left: left.right,
              right: right,
            },
          });
        }
        if (right.type === "BinaryExpression" && right.operator === "and") {
          return toCNF({
            type: "BinaryExpression",
            operator: "and",
            left: {
              type: "BinaryExpression",
              operator: "or",
              left: left,
              right: right.left,
            },
            right: {
              type: "BinaryExpression",
              operator: "or",
              left: left,
              right: right.right,
            },
          });
        }
        return {
          type: "BinaryExpression",
          operator: "or",
          left,
          right,
        };
      }
      return node;
    case "Quantifier":
      return {
        ...node,
        formula: toCNF(node.formula),
      };
    case "UnaryExpression":
      return node;
    default:
      return node;
  }
}

// 9. Prevod na množinovú reprezentáciu
export function flattenCNF(node: ASTNode): string[][] {
  const clauses: string[][] = [];

  function collectClauses(n: ASTNode) {
    if (n.type === "BinaryExpression" && n.operator === "and") {
      collectClauses(n.left);
      collectClauses(n.right);
    } else {
      const literals: string[] = [];
      const visited = new Set<string>();

      function collectLiterals(ln: ASTNode) {
        if (ln.type === "BinaryExpression" && ln.operator === "or") {
          collectLiterals(ln.left);
          collectLiterals(ln.right);
        } else {
          const litStr = stringifyAST(ln);
          if (!visited.has(litStr)) {
            literals.push(litStr);
            visited.add(litStr);
          }
        }
      }
      collectLiterals(n);
      clauses.push(literals);
    }
  }

  collectClauses(node);
  return clauses;
}

// --- UTIL FUNCTIONS (STRING INTERFACE) ---

export function stringifyNegated(ast: ASTNode): string {
  if (ast.type === "UnaryExpression" && ast.operator === "not") {
    const inner = ast.operand;
    const isSimple =
      inner.type === "Predicate" ||
      inner.type === "Function" ||
      inner.type === "Constant" ||
      inner.type === "Variable";
    const innerStr = stringifyAST(inner);
    if (!isSimple) {
      return `¬(${innerStr})`;
    }
    return `¬${innerStr}`;
  }
  return stringifyAST(ast);
}

export function removeImpliesFromString(formula: string): string {
  const tokens = logicTokenize(formula);
  try {
    const ast = parseStandardFormula(tokens);
    const withoutImplies = replaceImplies(ast);
    return stringifyAST(withoutImplies);
  } catch {
    return formula;
  }
}

export function negateFormulaFromString(formula: string): string {
  const tokens = logicTokenize(formula);
  try {
    const ast = parseStandardFormula(tokens);
    const negated = negateFormula(ast);
    return stringifyNegated(negated);
  } catch {
    return formula;
  }
}

export function toNNFFromString(formula: string): string {
  const tokens = logicTokenize(formula);
  try {
    const ast = parseStandardFormula(tokens);
    const withoutImplies = replaceImplies(ast);
    const nnf = toNNF(withoutImplies);
    return stringifyAST(nnf);
  } catch {
    return formula;
  }
}

export function renameQuantifierVariablesFromString(formula: string): string {
  const tokens = logicTokenize(formula);
  try {
    const ast = parseStandardFormula(tokens);
    const standardized = renameQuantifierVariables(ast);
    return stringifyAST(standardized);
  } catch {
    return formula;
  }
}

export function toPNFFromString(formula: string): string {
  try {
    const tokens = logicTokenize(formula);
    const ast = parseStandardFormula(tokens);
    const withoutImplies = replaceImplies(ast);
    const nnf = toNNF(withoutImplies);
    const standardized = renameQuantifierVariables(nnf);
    const pnf = toPNF(standardized);
    return stringifyAST(pnf);
  } catch {
    return formula;
  }
}

export function skolemizeFromString(formula: string): string {
  try {
    const tokens = logicTokenize(formula);
    const ast = parseStandardFormula(tokens);
    const withoutImplies = replaceImplies(ast);
    const nnf = toNNF(withoutImplies);
    const standardized = renameQuantifierVariables(nnf);
    const pnf = toPNF(standardized);
    const skolemized = skolemize(pnf);
    return stringifyAST(skolemized);
  } catch {
    return formula;
  }
}

export function removeForallQuantifiersFromString(formula: string): string {
  try {
    const tokens = logicTokenize(formula);
    const ast = parseStandardFormula(tokens);
    const withoutForall = removeForallQuantifiers(ast);
    return stringifyAST(withoutForall);
  } catch {
    return formula;
  }
}

export function toCNFFromString(formula: string): string {
  try {
    const tokens = logicTokenize(formula);
    const ast = parseStandardFormula(tokens);
    const withoutImplies = replaceImplies(ast);
    const nnf = toNNF(withoutImplies);
    const standardized = renameQuantifierVariables(nnf);
    const pnf = toPNF(standardized);
    const skolemized = skolemize(pnf);
    const withoutForall = removeForallQuantifiers(skolemized);
    const cnf = toCNF(withoutForall);
    return stringifyAST(cnf);
  } catch {
    return formula;
  }
}

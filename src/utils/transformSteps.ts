import {
  type ASTNode,
  stringifyAST,
  parseStandardFormula,
} from "./parserStandard";
import { logicTokenize } from "./tokenizer";

export function negateFormula(ast: ASTNode): ASTNode {
  return {
    type: "UnaryExpression",
    operator: "not",
    operand: ast,
  };
}

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

export function renameQuantifierVariables(ast: ASTNode): ASTNode {
  // globalUsed udržiava množinu všetkých mien premenných, ktoré sa už v kvantifikátoroch vyskytli
  const globalUsed: Set<string> = new Set();

  // subscript helper pre a₁, a₂ ...
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

        // Ak je táto premenná kvantifikátora už globálne použitá niekde inde, musíme ju premenovať
        if (globalUsed.has(node.variable)) {
          newVarName = getNextVarName();
        }

        globalUsed.add(newVarName);

        // Vytvoríme nový kontext nahradení pre telo kvantifikátora
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
        // Ak máme pre túto premennú v aktuálnom kontexte náhradu, použijeme ju
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

// Funkcia: Odstráni implikácie zo stringovej formule
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

// Funkcia: Neguje stringovú formulu
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

// Funkcia: Prevedie stringovú formulu do NNF
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

// Funkcia: Premenuje viazané premenné (Standardization)
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

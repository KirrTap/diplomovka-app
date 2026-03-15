import {
  type ASTNode,
  stringifyAST,
  parseStandardFormula,
} from "./parserStandard";
import { logicTokenize } from "./tokenizer";

//Negated formula
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

/**
 * 1. Prepis implikácií (A => B  ->  ¬A ∨ B)
 */
export function replaceImplies(node: ASTNode): ASTNode {
  switch (node.type) {
    case "BinaryExpression":
      if (node.operator === "implies") {
        const left = replaceImplies(node.left);
        const right = replaceImplies(node.right);

        // Ak je ľavá strana už negovaná (¬P), tak ¬(¬P) zmeníme na P
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

// Negation Normal Form (NNF)
// Predpokladá, že implikácie už sú odstránené.
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
          // predtým tu bol aj "implies", teraz len "or"
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
        // Tu už nečakáme implies, toNNF len rekurzívne pokračuje
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

/**
 * String interface helpers for testing and simple transformations
 */

export function negateFormulaFromString(formula: string): string {
  const tokens = logicTokenize(formula);
  const ast = parseStandardFormula(tokens);
  // Použijeme stringifyNegated, aby sme mali pekný výstup ¬(...)
  return stringifyNegated(negateFormula(ast));
}

export function toNNFFromString(formula: string): string {
  const tokens = logicTokenize(formula);
  const ast = parseStandardFormula(tokens);
  // NNF vyžaduje odstránenie implikácií ako prvý krok
  return stringifyAST(toNNF(replaceImplies(ast)));
}

export function removeImpliesFromString(formula: string): string {
  const tokens = logicTokenize(formula);
  const ast = parseStandardFormula(tokens);
  return stringifyAST(replaceImplies(ast));
}

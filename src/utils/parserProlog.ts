import type { LogicToken } from "./tokenizer";
import type { ASTNode } from "./parserStandard";

function parsePrologPredicate(tokens: LogicToken[]): ASTNode {
  if (tokens.length === 0) {
    throw new Error("errors.error_prolog_invalid_predicate");
  }
  const nameToken = tokens[0];
  if (nameToken.type === "upper_id") {
    throw new Error(`errors.error_prolog_predicate_lowercase|${nameToken.value}`);
  }
  if (nameToken.type !== "lower_id") {
    throw new Error(`errors.error_prolog_unexpected_token|${nameToken.type === 'unknown' ? nameToken.value : nameToken.type}`);
  }

  if (tokens.length === 1) {
    return { type: "Predicate", name: nameToken.value, args: [] };
  }

  if (tokens[1].type !== "lparen" || tokens[tokens.length - 1].type !== "rparen") {
    throw new Error("errors.error_prolog_invalid_predicate");
  }

  const args: ASTNode[] = [];
  const innerTokens = tokens.slice(2, -1);
  if (innerTokens.length === 0) {
    throw new Error("errors.error_empty_arguments");
  }

  let depth = 0;
  let currentArg: LogicToken[] = [];
  
  for (let i = 0; i < innerTokens.length; i++) {
    const t = innerTokens[i];
    if (t.type === "lparen") depth++;
    else if (t.type === "rparen") depth--;

    if (t.type === "comma" && depth === 0) {
      if (currentArg.length === 0) throw new Error("errors.error_unexpected_comma");
      args.push(parsePrologTerm(currentArg));
      currentArg = [];
    } else {
      currentArg.push(t);
    }
  }
  if (currentArg.length === 0) throw new Error("errors.error_unexpected_comma");
  args.push(parsePrologTerm(currentArg));

  return { type: "Predicate", name: nameToken.value, args };
}

function parsePrologTerm(tokens: LogicToken[]): ASTNode {
  if (tokens.length === 0) throw new Error("errors.error_prolog_invalid_term");
  
  if (tokens.length === 1) {
    const t = tokens[0];
    if (t.type === "upper_id" || (t.type === "lower_id" && t.value.startsWith("_"))) {
      return { type: "Variable", name: t.value };
    }
    if (t.type === "lower_id") {
      return { type: "Constant", name: t.value };
    }
    throw new Error(`errors.error_prolog_unexpected_token|${t.type === 'unknown' ? t.value : t.type}`);
  }

  // It must be a function
  const nameToken = tokens[0];
  if (nameToken.type !== "lower_id") {
    throw new Error(`errors.error_prolog_unexpected_token|${nameToken.type === 'unknown' ? nameToken.value : nameToken.type}`);
  }
  if (tokens[1].type !== "lparen" || tokens[tokens.length - 1].type !== "rparen") {
    throw new Error("errors.error_prolog_invalid_term");
  }

  const args: ASTNode[] = [];
  const innerTokens = tokens.slice(2, -1);
  if (innerTokens.length === 0) throw new Error("errors.error_empty_arguments");

  let depth = 0;
  let currentArg: LogicToken[] = [];
  for (let i = 0; i < innerTokens.length; i++) {
    const t = innerTokens[i];
    if (t.type === "lparen") depth++;
    else if (t.type === "rparen") depth--;

    if (t.type === "comma" && depth === 0) {
      if (currentArg.length === 0) throw new Error("errors.error_unexpected_comma");
      args.push(parsePrologTerm(currentArg));
      currentArg = [];
    } else {
      currentArg.push(t);
    }
  }
  if (currentArg.length === 0) throw new Error("errors.error_unexpected_comma");
  args.push(parsePrologTerm(currentArg));

  return { type: "Function", name: nameToken.value, args };
}

function parsePrologBody(tokens: LogicToken[]): ASTNode {
  const literals: ASTNode[] = [];
  let depth = 0;
  let currentLiteral: LogicToken[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "lparen") depth++;
    else if (t.type === "rparen") depth--;

    if (t.type === "comma" && depth === 0) {
      if (currentLiteral.length === 0) throw new Error("errors.error_unexpected_comma");
      literals.push(parsePrologLiteral(currentLiteral));
      currentLiteral = [];
    } else {
      currentLiteral.push(t);
    }
  }
  if (currentLiteral.length === 0) throw new Error("errors.error_unexpected_comma");
  literals.push(parsePrologLiteral(currentLiteral));

  let ast = literals[0];
  for (let i = 1; i < literals.length; i++) {
    ast = {
      type: "BinaryExpression",
      operator: "and",
      left: ast,
      right: literals[i]
    };
  }
  return ast;
}

function parsePrologLiteral(tokens: LogicToken[]): ASTNode {
  if (tokens.length === 0) throw new Error("errors.error_prolog_invalid_predicate");
  if (tokens[0].type === "not") {
    return {
      type: "UnaryExpression",
      operator: "not",
      operand: parsePrologPredicate(tokens.slice(1))
    };
  }
  return parsePrologPredicate(tokens);
}

export function parsePrologFormula(tokens: LogicToken[]): ASTNode {
  const eofLessTokens = tokens.filter(t => t.type !== "eof");
  if (eofLessTokens.length === 0) {
    throw new Error("errors.error_prolog_empty_statement");
  }

  // Split by fact (dot .)
  const statements: LogicToken[][] = [];
  let currentStmt: LogicToken[] = [];
  for (let i = 0; i < eofLessTokens.length; i++) {
    const t = eofLessTokens[i];
    if (t.type === "fact") {
      statements.push(currentStmt);
      currentStmt = [];
    } else {
      currentStmt.push(t);
    }
  }

  if (currentStmt.length > 0) {
    throw new Error("errors.error_prolog_missing_dot");
  }

  const kbNodes: ASTNode[] = [];
  let queryNode: ASTNode | null = null;

  for (const stmtTokens of statements) {
    if (stmtTokens.length === 0) continue; // Skip empty statements (like double dots)

    // Check if query
    if (stmtTokens[0].type === "query") {
      if (queryNode !== null) {
        throw new Error("errors.error_prolog_multiple_queries");
      }
      const bodyTokens = stmtTokens.slice(1);
      const ast = parsePrologBody(bodyTokens);
      
      queryNode = ast;
      continue;
    }

    // Check if rule
    const ruleIndex = stmtTokens.findIndex(t => t.type === "rule");
    if (ruleIndex !== -1) {
      if (ruleIndex === 0 || ruleIndex === stmtTokens.length - 1) {
        throw new Error("errors.error_prolog_invalid_rule");
      }
      const headTokens = stmtTokens.slice(0, ruleIndex);
      const bodyTokens = stmtTokens.slice(ruleIndex + 1);

      const headAst = parsePrologPredicate(headTokens);
      const bodyAst = parsePrologBody(bodyTokens);

      const ast: ASTNode = {
        type: "BinaryExpression",
        operator: "implies",
        left: bodyAst,
        right: headAst
      };

      kbNodes.push(ast);
      continue;
    }

    // Otherwise it's a fact
    const ast = parsePrologPredicate(stmtTokens);
    kbNodes.push(ast);
  }

  // Combine KB
  let kbAst: ASTNode | null = null;
  if (kbNodes.length > 0) {
    kbAst = kbNodes[0];
    for (let i = 1; i < kbNodes.length; i++) {
      kbAst = {
        type: "BinaryExpression",
        operator: "and",
        left: kbAst,
        right: kbNodes[i]
      };
    }
  }

  if (queryNode && kbAst) {
    return {
      type: "BinaryExpression",
      operator: "implies",
      left: kbAst,
      right: queryNode
    };
  } else if (queryNode) {
    return queryNode;
  } else if (kbAst) {
    throw new Error("errors.error_prolog_missing_query");
  } else {
    throw new Error("errors.error_prolog_empty_statement");
  }
}

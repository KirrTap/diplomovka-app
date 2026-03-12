// parserStandard.ts - Parser for standard logical formulas
import type { LogicToken } from './tokenizer';

// AST Node Definitions
export type ASTNode =
  | { type: 'BinaryExpression'; operator: 'implies' | 'and' | 'or'; left: ASTNode; right: ASTNode }
  | { type: 'UnaryExpression'; operator: 'not'; operand: ASTNode }
  | { type: 'Quantifier'; symbol: 'forall' | 'exists'; variable: string; formula: ASTNode }
  | { type: 'Predicate'; name: string; args: ASTNode[] }
  | { type: 'Constant'; name: string }
  | { type: 'Variable'; name: string }
  | { type: 'Function'; name: string; args: ASTNode[] };

export function parseStandardFormula(tokens: LogicToken[]): ASTNode {
  let pos = 0;
  function peek(): LogicToken { return tokens[pos]; }
  function eat(type: LogicToken['type']): void { if (tokens[pos].type === type) pos++; else throw new Error('Unexpected token: ' + tokens[pos].type); }
  function parseExpression(): ASTNode {
    return parseImplication();
  }

  function parseImplication(): ASTNode {
    let node = parseDisjunction();
    while (peek().type === 'implies') {
      eat('implies');
      const right = parseImplication();
      node = { type: 'BinaryExpression', operator: 'implies', left: node, right };
    }
    return node;
  }

  function parseDisjunction(): ASTNode {
    let node = parseConjunction();
    while (peek().type === 'or') {
      eat('or');
      const right = parseDisjunction();
      node = { type: 'BinaryExpression', operator: 'or', left: node, right };
    }
    return node;
  }

  function parseConjunction(): ASTNode {
    let node = parseNegation();
    while (peek().type === 'and') {
      eat('and');
      const right = parseConjunction();
      node = { type: 'BinaryExpression', operator: 'and', left: node, right };
    }
    return node;
  }

  function parseNegation(): ASTNode {
    if (peek().type === 'not') {
      eat('not');
      const operand = parseNegation();
      return { type: 'UnaryExpression', operator: 'not', operand };
    }
    return parseQuantifier();
  }

  function parseQuantifier(): ASTNode {
    const next = peek();
    if (next.type === 'forall' || next.type === 'exists') {
      const symbol = next.type;
      eat(symbol);
      const varToken = peek();
      if (varToken.type !== 'lower_id') {
        throw new Error('errors.quantifier_variable_missing');
      }
      const variable = (varToken as any).value;
      eat('lower_id');
      const formula = parseQuantifier();
      return { type: 'Quantifier', symbol, variable, formula };
    }
    return parseAtom();
  }

  // Parse atom: Predicate (Upper) or bracketed expression
  function parseAtom(): ASTNode {
    // Handling (∀x) or (∃x) or (Expression)
    if (peek().type === 'lparen') {
      const next = tokens[pos + 1];
      if (next && (next.type === 'forall' || next.type === 'exists')) {
        // Case (∀x)
        eat('lparen');
        const symbol = next.type;
        eat(symbol);
        const varToken = peek();
        if (varToken.type !== 'lower_id') {
          throw new Error('errors.quantifier_variable_missing');
        }
        const variable = (varToken as any).value;
        eat('lower_id');
        if (peek().type !== 'rparen') throw new Error('errors.error_parentheses');
        eat('rparen');
        // Now parse the formula that follows
        const formula = parseQuantifier();
        return { type: 'Quantifier', symbol, variable, formula };
      } else {
        // Case (Expression)
        eat('lparen');
        const node = parseExpression();
        if (peek().type !== 'rparen') throw new Error('errors.error_parentheses');
        eat('rparen');
        return node;
      }
    }

    if (peek().type === 'rparen') {
      throw new Error('errors.error_parentheses');
    }

    if (peek().type === 'lower_id') {
      const name = (peek() as any).value;
      throw new Error(`errors.error_unexpected_variable|${name}`);
    }

    // Predikát: Začína veľkým písmenom (Upper_ID)
    if (peek().type === 'upper_id') {
      const name = (peek() as any).value;
      eat('upper_id');
      let args: ASTNode[] = [];
      if (peek().type === 'lparen') {
        eat('lparen');
        while (peek().type === 'upper_id' || peek().type === 'lower_id') {
          args.push(parseTerm());
          if (peek().type === 'comma') eat('comma');
        }
        eat('rparen');
      }
      return { type: 'Predicate', name, args };
    }
    throw new Error('Unexpected token in parseAtom: ' + peek().type);
  }

  // Parse term: Constant (Upper), Variable (Lower), Function (Lower + '(')
  function parseTerm(): ASTNode {
    // Konštanta: Upper_ID (bez zátvoriek v rámci termu)
    if (peek().type === 'upper_id') {
      const name = (peek() as any).value;
      eat('upper_id');
      return { type: 'Constant', name };
    }
    
    // Premenná alebo Funkcia: Lower_ID
    if (peek().type === 'lower_id') {
      const name = (peek() as any).value;
      eat('lower_id');
      if (peek().type === 'lparen') {
        eat('lparen');
        let args: ASTNode[] = [];
        while (peek().type === 'upper_id' || peek().type === 'lower_id') {
          args.push(parseTerm());
          if (peek().type === 'comma') eat('comma');
        }
        eat('rparen');
        return { type: 'Function', name, args };
      }
      return { type: 'Variable', name };
    }
    throw new Error('Unexpected token in parseTerm: ' + peek().type);
  }

  // Start
  const ast = parseExpression();

  if (peek().type !== 'eof') {
    throw new Error('errors.error_parentheses');
  }

  return ast;
}


export function stringifyAST(node: ASTNode, parentType?: ASTNode['type']): string {
  switch (node.type) {
    case 'BinaryExpression': {
      const ops = { and: '∧', or: '∨', implies: '=>' };
      const leftStr = stringifyAST(node.left, 'BinaryExpression');
      const rightStr = stringifyAST(node.right, 'BinaryExpression');
      return `(${leftStr} ${ops[node.operator]} ${rightStr})`;
    }
    case 'UnaryExpression': {
      const operandStr = stringifyAST(node.operand, 'UnaryExpression');
      // Add parentheses only if operand is also a UnaryExpression (nested negation)
      if (node.operand.type === 'UnaryExpression') {
        return `¬(${operandStr})`;
      }
      return `¬${operandStr}`;
    }
    case 'Quantifier': {
      const syms = { forall: '∀', exists: '∃' };
      const formulaStr = stringifyAST(node.formula, 'Quantifier');
      const result = `(${syms[node.symbol]}${node.variable})${formulaStr}`;
      
      // If quantifier is operand of binary expression, wrap in parentheses
      // because quantifier has stronger binding than binary operators
      if (parentType === 'BinaryExpression') {
        return `(${result})`;
      }
      
      // If at top level and formula contains binary expression or quantifier, wrap in parentheses
      if (!parentType && (node.formula.type === 'BinaryExpression' || node.formula.type === 'Quantifier')) {
        return `(${result})`;
      }
      
      return result;
    }
    case 'Predicate':
      return node.args.length > 0
        ? `${node.name}(${node.args.map(arg => stringifyAST(arg)).join(',')})`
        : node.name;
    case 'Function':
      return `${node.name}(${node.args.map(arg => stringifyAST(arg)).join(',')})`;
    case 'Constant':
    case 'Variable':
      return node.name;
    default:
      return '';
  }
}

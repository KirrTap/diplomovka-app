import { logicTokenize } from '../src/utils/tokenizer';
import { parseStandardFormula } from '../src/utils/parserStandard';
import { describe, it, expect } from 'vitest';

describe('parseStandardFormula', () => {
  it('throws error if formula has no binary logical connectives (and, or, implies)', () => {
    // Just a predicate, negation or quantifier without ∧, ∨, => should fail
    const inputs = ['P(x, y)', '¬P(x)', '∀x P(x)', '¬∀x P(x)'];
    for (const input of inputs) {
      const tokens = logicTokenize(input);
      expect(() => parseStandardFormula(tokens)).toThrow('Formula must contain at least one binary logical connective');
    }
  });

  it('parses typical predicate with variable, constant and function when inside a binary expression', () => {
    const input = 'P(x, A, f(y)) ∧ Q(z)';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens) as any;
    expect(ast.type).toBe('BinaryExpression');
    expect(ast.operator).toBe('and');
    const left = ast.left;
    expect(left.type).toBe('Predicate');
    expect(left.name).toBe('P');
    expect(left.args.length).toBe(3);
    expect(left.args[0]).toEqual({ type: 'Variable', name: 'x' });
    expect(left.args[1]).toEqual({ type: 'Constant', name: 'A' });
    expect(left.args[2]).toEqual({ type: 'Function', name: 'f', args: [ { type: 'Variable', name: 'y' } ] });
  });

  it('respects operator precedence: implies < or < and < not', () => {
    // ¬P ∧ Q ∨ R => S should be (((¬P) ∧ Q) ∨ R) => S
    const input = '¬P ∧ Q ∨ R => S';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens) as any;

    expect(ast.type).toBe('BinaryExpression');
    expect(ast.operator).toBe('implies');
    
    const leftOr = ast.left;
    expect(leftOr.type).toBe('BinaryExpression');
    expect(leftOr.operator).toBe('or');

    const leftAnd = leftOr.left;
    expect(leftAnd.type).toBe('BinaryExpression');
    expect(leftAnd.operator).toBe('and');

    const negation = leftAnd.left;
    expect(negation.type).toBe('UnaryExpression');
    expect(negation.operator).toBe('not');
  });

  it('handles parentheses correctly', () => {
    // A ∧ (B ∨ C)
    const input = 'A ∧ (B ∨ C)';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens) as any;

    expect(ast.type).toBe('BinaryExpression');
    expect(ast.operator).toBe('and');
    expect(ast.right.type).toBe('BinaryExpression');
    expect(ast.right.operator).toBe('or');
  });

  it('parses complex nested terms', () => {
    const input = 'P(f(g(x, y)), A)';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens) as any;

    expect(ast.type).toBe('Predicate');
    expect(ast.args[0].type).toBe('Function');
    expect(ast.args[0].name).toBe('f');
    expect(ast.args[0].args[0].type).toBe('Function');
    expect(ast.args[0].args[0].name).toBe('g');
  });

  it('throws error on invalid syntax', () => {
    const input = 'P(x ∧ Q(y)'; // missing closing paren
    const tokens = logicTokenize(input);
    expect(() => parseStandardFormula(tokens)).toThrow();
  });

  it('parses quantifiers with binary connectives', () => {
    // ∀x (P(x) => Q(x))
    const input = '∀x (P(x) => Q(x))';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens) as any;

    expect(ast.type).toBe('Quantifier');
    expect(ast.symbol).toBe('forall');
    expect(ast.variable).toBe('x');
    
    expect(ast.formula.type).toBe('BinaryExpression');
    expect(ast.formula.operator).toBe('implies');
  });
});

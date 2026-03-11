import { parseStandardFormula, stringifyAST } from '../src/utils/parserStandard';
import { logicTokenize } from '../src/utils/tokenizer';
import { describe, it, expect } from 'vitest';

describe('parseStandardFormula', () => {
  it('should parse P(x) => Q(y) correctly', () => {
    const input = 'P(x) => Q(y)';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe('(P(x) => Q(y))');
  })

  it('should parse (∀x) P(x) ∧ Q(y) correctly', () => {
    const input = '(∀x) P(x) ∧ Q(y)';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe('((∀x) P(x) ∧ Q(y))');
  })

  it('should throw error for (∀x) P(x) due to missing binary connective', () => {
    const input = '(∀x) P(x)';
    const tokens = logicTokenize(input);
    expect(() => parseStandardFormula(tokens)).toThrow('errors.error_no_binary_connective');
  })
});


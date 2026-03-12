import { parseStandardFormula, stringifyAST } from '../src/utils/parserStandard';
import { logicTokenize } from '../src/utils/tokenizer';
import { describe, it, expect } from 'vitest';

describe('parseStandardFormula', () => {

  it('should parse A ∧ B ∨ C correctly', () => {
    const input = 'A ∧ B ∨ C';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe('((A ∧ B) ∨ C)');
  })

  it('should parse ¬¬¬P(x)correctly', () => {
    const input = '¬¬¬P(x)';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe('¬(¬(¬P(x)))');
  })
  
  it('should parse ∀x ∃y (P(x) => Q(y)) correctly', () => {
    const input = '∀x ∃y (P(x) => Q(y))';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe('((∀x)(∃y)(P(x) => Q(y)))');
  })  
  
  it('should parse (∀x)P(x) => R(a) correctly', () => {
    const input = '(∀x)P(x) => R(a)';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe('(((∀x)P(x)) => R(a))');
  })    

  it('should parse P(x, f(y, g(z))) correctly', () => {
    const input = 'P(x, f(y, g(z)))';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe('P(x,f(y,g(z)))');
  }) 

  it('should parse A => B => C correctly', () => {
    const input = 'A => B => C';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe('(A => (B => C))');
  })         

  it('should parse ∀x (P(x) ∨ ¬P(x)) correctly', () => {
    const input = '∀x (P(x) ∨ ¬P(x))';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe('((∀x)(P(x) ∨ ¬P(x)))');
  })   

  it('should parse P(a) ∧ (Q(b) ∨ R(c)) correctly', () => {
    const input = 'P(a) ∧ (Q(b) ∨ R(c))';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe('(P(a) ∧ (Q(b) ∨ R(c)))');
  }) 
  
  it('should parse ∀x ∀y ∀z P(x,y,z) correctly', () => {
    const input = '∀x ∀y ∀z P(x,y,z)';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe('((∀x)(∀y)(∀z)P(x,y,z))');
  })  

  it('should parse P(x) => Q(y) correctly', () => {
    const input = 'P(x) => Q(y)';
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe('(P(x) => Q(y))');
  })
});


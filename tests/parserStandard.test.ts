import {
  parseStandardFormula,
  stringifyAST,
} from "../src/utils/parserStandard";
import { logicTokenize } from "../src/utils/tokenizer";
import { describe, it, expect } from "vitest";

describe("success parseStandardFormula", () => {
  it("should parse A ∧ B ∨ C ", () => {
    const input = "A ∧ B ∨ C";
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe("(A ∧ B) ∨ C");
  });

  it("should parse ¬ P(x) => Q(y) ∧¬ P(x)", () => {
    const input = "¬ P(x) => Q(y) ∧¬ P(x)";
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe("¬P(x) => (Q(y) ∧ ¬P(x))");
  });

  it("should parse (∀x)P(x) => R(a)", () => {
    const input = "(∀x)P(x) => R(a)";
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe("((∀x)P(x)) => R(a)");
  });


  it("should parse A => B => C ", () => {
    const input = "A => B => C";
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe("A => (B => C)");
  });


  it("should parse P(a) ∧ (Q(b) ∨ R(c))", () => {
    const input = "P(a) ∧ (Q(b) ∨ R(c))";
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe("P(a) ∧ (Q(b) ∨ R(c))");
  });


  it("should parse P(a) ∧ (Q(b) ∨ (R(c) ∧ S(d)))", () => {
    const input = "P(a) ∧ (Q(b) ∨ (R(c) ∧ S(d)))";
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe("P(a) ∧ (Q(b) ∨ (R(c) ∧ S(d)))");
  });

  it("should parse A ∨ B ∧ C => D", () => {
    const input = "A ∨ B ∧ C => D";
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe("(A ∨ (B ∧ C)) => D");
  });

  it("should parse P(x) => Q(y)", () => {
    const input = "P(x) => Q(y)";
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe("P(x) => Q(y)");
  });

  it("should parse ((P(x) ∧ Q(y)) => R(z)) ∧ (¬R(A) ∨ (S(B) ∧ T(C))) => ((P(x) ∧ Q(y)) => (S(B) ∧ T(C)))", () => {
    const input =
      "((P(x) ∧ Q(y)) => R(z)) ∧ (¬R(A) ∨ (S(B) ∧ T(C))) => ((P(x) ∧ Q(y)) => (S(B) ∧ T(C)))";
    const tokens = logicTokenize(input);
    const ast = parseStandardFormula(tokens);
    expect(stringifyAST(ast)).toBe(
      "(((P(x) ∧ Q(y)) => R(z)) ∧ (¬R(A) ∨ (S(B) ∧ T(C)))) => ((P(x) ∧ Q(y)) => (S(B) ∧ T(C)))",
    );
  });
});

// describe("fail parseStandardFormula", () => {
//   it("Quantifier must be followed by a variable 1.1", () => {
//     const input = "∀ P(x)";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.quantifier_variable_missing",
//     );
//   });

//   it("Quantifier must be followed by a variable 1.2", () => {
//     const input = "∃y ∀x P(x) => ∃ Q(y)";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.quantifier_variable_missing",
//     );
//   });

//   it("should fail if comma is at the end of arguments in predicate", () => {
//     const input = "∀x P(x,) => Q(y)";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.error_unexpected_comma",
//     );
//   });

//   it("should fail if comma is at the end of arguments in function", () => {
//     const input = "P(f(x,))";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.error_unexpected_comma",
//     );
//   });

//   it("should fail if comma is at the end of arguments in binary expression", () => {
//     const input = "∀x P(x), Q(x) => Q(y)";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.error_unexpected_comma",
//     );
//   });

//   it("should fail if variable stands alone", () => {
//     const input = "P(x) ∧ x";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.error_unexpected_variable|x",
//     );
//   });

//   it("should fail if predicate has empty arguments", () => {
//     const input = "P ∧ Q() ∨ R(x)";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.error_empty_arguments",
//     );
//   });

//   it("should fail if function has empty arguments", () => {
//     const input = "P(f())";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.error_empty_arguments",
//     );
//   });

//   it("should fail if function has empty arguments", () => {
//     const input = ",P(f(x))";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.error_unexpected_comma",
//     );
//   });

//   it("should fail if operator is inside arguments", () => {
//     const input = "P(x ∧ y)";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.error_operator_inside_arguments",
//     );
//   });

//   it("should fail if right side is missing", () => {
//     const input = "P(x) =>";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.error_missing_right_side",
//     );
//   });

//   it("should fail if left side is missing", () => {
//     const input = "∨P(x)";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.error_missing_left_side",
//     );
//   });

//   it("should fail if predicate is used as argument", () => {
//     const input = "P(Q(x)) ";
//     const tokens = logicTokenize(input);
//     expect(() => parseStandardFormula(tokens)).toThrow(
//       "errors.error_predicate_as_argument|Q",
//     );
//   });
// });

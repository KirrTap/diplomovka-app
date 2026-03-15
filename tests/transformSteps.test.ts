import { stringifyNegated, negateFormula } from "../src/utils/transformSteps";
import { parseStandardFormula } from "../src/utils/parserStandard";
import { logicTokenize } from "../src/utils/tokenizer";
import { describe, it, expect } from "vitest";

describe("negated formula", () => {
  it("(A ∧ B) ∨ C ", () => {
    const input = "(A ∧ B) ∨ C";
    const ast = parseStandardFormula(logicTokenize(input));
    const negatedAst = negateFormula(ast);
    expect(stringifyNegated(negatedAst)).toBe("¬((A ∧ B) ∨ C)");
  });

  it("¬P(x) => (Q(y) ∧ ¬P(x))", () => {
    const input = "¬P(x) => (Q(y) ∧ ¬P(x))";
    const ast = parseStandardFormula(logicTokenize(input));
    const negatedAst = negateFormula(ast);
    expect(stringifyNegated(negatedAst)).toBe("¬(¬P(x) => (Q(y) ∧ ¬P(x)))");
  });

  it("(∀x)¬(∃y)(P(x,y) ∧ ¬Q(y))", () => {
    const input = "(∀x)¬(∃y)(P(x,y) ∧ ¬Q(y))";
    const ast = parseStandardFormula(logicTokenize(input));
    const negatedAst = negateFormula(ast);
    expect(stringifyNegated(negatedAst)).toBe("¬((∀x)¬(∃y)(P(x,y) ∧ ¬Q(y)))");
  });
});

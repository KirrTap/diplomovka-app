import { describe, it, expect } from "vitest";
import { logicTokenize, decideLogicType } from "../src/utils/tokenizer";

describe("logicTokenize", () => {
  it("tokenizes simple formula", () => {
    expect(logicTokenize("A ∧ B")).toEqual([
      { type: "upper_id", value: "A" },
      { type: "and" },
      { type: "upper_id", value: "B" },
      { type: "eof" },
    ]);
  });

  it("tokenizes formula with implications and quantifiers", () => {
    expect(logicTokenize("(∀x) (P(x) => (∃y) Q(y))")).toEqual([
      { type: "lparen" },
      { type: "forall" },
      { type: "lower_id", value: "x" },
      { type: "rparen" },
      { type: "lparen" },
      { type: "upper_id", value: "P" },
      { type: "lparen" },
      { type: "lower_id", value: "x" },
      { type: "rparen" },
      { type: "implies" },
      { type: "lparen" },
      { type: "exists" },
      { type: "lower_id", value: "y" },
      { type: "rparen" },
      { type: "upper_id", value: "Q" },
      { type: "lparen" },
      { type: "lower_id", value: "y" },
      { type: "rparen" },
      { type: "rparen" },
      { type: "eof" },
    ]);
  });

  it("tokenizes formula with comma", () => {
    expect(logicTokenize("P(x,y)")).toEqual([
      { type: "upper_id", value: "P" },
      { type: "lparen" },
      { type: "lower_id", value: "x" },
      { type: "comma" },
      { type: "lower_id", value: "y" },
      { type: "rparen" },
      { type: "eof" },
    ]);
  });
  it("tokenizes formula with unknown characters", () => {
    expect(logicTokenize("A $ B")).toEqual([
      { type: "upper_id", value: "A" },
      { type: "unknown", value: "$" },
      { type: "upper_id", value: "B" },
      { type: "eof" },
    ]);

    expect(logicTokenize("P(x) => (∃y)$Q(y)")).toEqual([
      { type: "upper_id", value: "P" },
      { type: "lparen" },
      { type: "lower_id", value: "x" },
      { type: "rparen" },
      { type: "implies" },
      { type: "lparen" },
      { type: "exists" },
      { type: "lower_id", value: "y" },
      { type: "rparen" },
      { type: "unknown", value: "$" },
      { type: "upper_id", value: "Q" },
      { type: "lparen" },
      { type: "lower_id", value: "y" },
      { type: "rparen" },
      { type: "eof" },
    ]);
  });

  it(" input with only unknown characters", () => {
    expect(logicTokenize("#&@")).toEqual([
      { type: "unknown", value: "#" },
      { type: "unknown", value: "&" },
      { type: "unknown", value: "@" },
      { type: "eof" },
    ]);
  });

  it("tokenizes prolog variables and predicates", () => {
    expect(logicTokenize("?- Predicate(X, y)")).toEqual([
      { type: "query" },
      { type: "upper_id", value: "Predicate" },
      { type: "lparen" },
      { type: "upper_id", value: "X" },
      { type: "comma" },
      { type: "lower_id", value: "y" },
      { type: "rparen" },
      { type: "eof" },
    ]);
  });

  it("detect rule", () => {
    expect(logicTokenize("ancestor(X, Y) :- parent(X, Y)")).toEqual([
      { type: "lower_id", value: "ancestor" },
      { type: "lparen" },
      { type: "upper_id", value: "X" },
      { type: "comma" },
      { type: "upper_id", value: "Y" },
      { type: "rparen" },
      { type: "rule" },
      { type: "lower_id", value: "parent" },
      { type: "lparen" },
      { type: "upper_id", value: "X" },
      { type: "comma" },
      { type: "upper_id", value: "Y" },
      { type: "rparen" },
      { type: "eof" },
    ]);
  });

  it("empty input", () => {
    expect(logicTokenize("  ")).toEqual([{ type: "eof" }]);
  });
});

describe("decideLogicType", () => {
  it("should detect sekvent", () => {
    const tokens = logicTokenize("A⊢B");
    expect(decideLogicType(tokens)).toBe("sekvent");
  });

  it("detect sekvent", () => {
    const tokens = logicTokenize("P(x) ⊢ Q(y)");
    expect(decideLogicType(tokens)).toBe("sekvent");
  });

  it("detect prolog (query)", () => {
    const tokens = logicTokenize("?- P(a, b)");
    expect(decideLogicType(tokens)).toBe("prolog");
  });

  it("detect prolog (rule)", () => {
    const tokens = logicTokenize("ancestor(X, Y) :- parent(X, Y)");
    expect(decideLogicType(tokens)).toBe("prolog");
  });

  it("detect prolog (fact)", () => {
    const tokens = logicTokenize("parent(john, mary).");
    expect(decideLogicType(tokens)).toBe("prolog");
  });

  it("detect standard", () => {
    const tokens = logicTokenize("A ∧ B ∨ C => D");
    expect(decideLogicType(tokens)).toBe("standard");
  });

  it("prolog syntax for full input", () => {
    const input = `parent(john, mary).
            loves(mary, pizza).
            ancestor(X, Y) :- parent(X, Y).
            ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).
            ?- ancestor(john, mary).
            ?- loves(mary, pizza).`;
    const tokens = logicTokenize(input);
    expect(decideLogicType(tokens)).toBe("prolog");
  });
});

import {
  removeImpliesFromString,
  negateFormulaFromString,
  toNNFFromString,
  renameQuantifierVariablesFromString,
} from "../src/utils/transformSteps";
import { describe, it, expect } from "vitest";

describe("negated formula", () => {
  it("(A ∧ B) ∨ C ", () => {
    expect(negateFormulaFromString("(A ∧ B) ∨ C")).toBe("¬((A ∧ B) ∨ C)");
  });

  it("¬P(x) => (Q(y) ∧ ¬P(x))", () => {
    expect(negateFormulaFromString("¬P(x) => (Q(y) ∧ ¬P(x))")).toBe(
      "¬(¬P(x) => (Q(y) ∧ ¬P(x)))",
    );
  });

  it("(∀x)¬(∃y)(P(x,y) ∧ ¬Q(y))", () => {
    expect(negateFormulaFromString("(∀x)¬(∃y)(P(x,y) ∧ ¬Q(y))")).toBe(
      "¬((∀x)¬(∃y)(P(x,y) ∧ ¬Q(y)))",
    );
  });

  it("A => B", () => {
    expect(negateFormulaFromString("A => B")).toBe("¬(A => B)");
  });

  it("P(a) ∧ (Q(b) ∨ (R(c) ∧ S(d)))", () => {
    expect(negateFormulaFromString("P(a) ∧ (Q(b) ∨ (R(c) ∧ S(d)))")).toBe(
      "¬(P(a) ∧ (Q(b) ∨ (R(c) ∧ S(d))))",
    );
  });

  it("(((∀x)(Clovek(x) => Smrtelny(x))) ∧ Clovek(Sokrates)) => Smrtelny(Sokrates)", () => {
    expect(
      negateFormulaFromString(
        "(((∀x)(Clovek(x) => Smrtelny(x))) ∧ Clovek(Sokrates)) => Smrtelny(Sokrates)",
      ),
    ).toBe(
      "¬((((∀x)(Clovek(x) => Smrtelny(x))) ∧ Clovek(Sokrates)) => Smrtelny(Sokrates))",
    );
  });
});

describe("replace implies", () => {
  it("¬(A => B)", () => {
    expect(removeImpliesFromString("¬(A => B)")).toBe("¬(¬A ∨ B)");
  });

  it("¬((A ∧ B) ∨ C) ", () => {
    expect(removeImpliesFromString("¬((A ∧ B) ∨ C)")).toBe("¬((A ∧ B) ∨ C)");
  });

  it("¬(¬P(x) => (Q(y) ∧ ¬P(x)))", () => {
    expect(removeImpliesFromString("¬(¬P(x) => (Q(y) ∧ ¬P(x)))")).toBe(
      "¬(P(x) ∨ (Q(y) ∧ ¬P(x)))",
    );
  });

  it("¬(A => (B => C))", () => {
    expect(removeImpliesFromString("¬(A => (B => C))")).toBe(
      "¬(¬A ∨ (¬B ∨ C))",
    );
  });

  it("(A => B) => C", () => {
    expect(removeImpliesFromString("(A => B) => C")).toBe("¬(¬A ∨ B) ∨ C");
  });

  it("¬((((∀x)(Clovek(x) => Smrtelny(x))) ∧ Clovek(Sokrates)) => Smrtelny(Sokrates))", () => {
    expect(
      removeImpliesFromString(
        "¬((((∀x)(Clovek(x) => Smrtelny(x))) ∧ Clovek(Sokrates)) => Smrtelny(Sokrates))",
      ),
    ).toBe(
      "¬(¬(((∀x)(¬Clovek(x) ∨ Smrtelny(x))) ∧ Clovek(Sokrates)) ∨ Smrtelny(Sokrates))",
    );
  });

  it("(∀x)((((∃y)R(x,y)) ∧ ((∀y)¬S(x,y))) => ¬(((∃y)R(x,y)) ∧ P(z)))", () => {
    expect(
      removeImpliesFromString(
        "(∀x)((((∃y)R(x,y)) ∧ ((∀y)¬S(x,y))) => ¬(((∃y)R(x,y)) ∧ P(z)))",
      ),
    ).toBe(
      "(∀x)(¬(((∃y)R(x,y)) ∧ ((∀y)¬S(x,y))) ∨ ¬(((∃y)R(x,y)) ∧ P(z)))",
    );
  });
  
});

describe("to NNF", () => {
  it("¬(¬A ∨ B)", () => {
    expect(toNNFFromString("¬(¬A ∨ B)")).toBe("A ∧ ¬B");
  });

  it("¬((A ∧ B) ∨ C)", () => {
    expect(toNNFFromString("¬((A ∧ B) ∨ C)")).toBe("(¬A ∨ ¬B) ∧ ¬C");
  });

  it("¬(¬A ∨ (¬B ∨ C))", () => {
    expect(toNNFFromString("¬(¬A ∨ (¬B ∨ C))")).toBe("A ∧ (B ∧ ¬C)");
  });

  it("¬(((∀x)P(x)) ∨ R(a))", () => {
    expect(toNNFFromString("¬(((∀x)P(x)) ∨ R(a))")).toBe("((∃x)¬P(x)) ∧ ¬R(a)");
  });

  it("¬((∀x)P(x)) ∨ ((∃y) (Q(y) ∧ ¬R(b))))", () => {
    expect(toNNFFromString("¬((∀x P(x)) ∨ (∃y (Q(y) ∧ ¬R(b))))")).toBe(
      "((∃x)¬P(x)) ∧ ((∀y)(¬Q(y) ∨ R(b)))",
    );
  });

  it("¬(¬(((∀x)(¬Clovek(x) ∨ Smrtelny(x))) ∧ Clovek(Sokrates)) ∨ Smrtelny(Sokrates))", () => {
    expect(
      toNNFFromString(
        "¬(¬(((∀x)(¬Clovek(x) ∨ Smrtelny(x))) ∧ Clovek(Sokrates)) ∨ Smrtelny(Sokrates))",
      ),
    ).toBe(
      "(((∀x)(¬Clovek(x) ∨ Smrtelny(x))) ∧ Clovek(Sokrates)) ∧ ¬Smrtelny(Sokrates)",
    );
  });
  
  it("(∀x)(¬(((∃y)R(x,y)) ∧ ((∀y)¬S(x,y))) ∨ ¬(((∃y)R(x,y)) ∧ P(z)))", () => {
    expect(
      toNNFFromString(
        "(∀x)(¬(((∃y)R(x,y)) ∧ ((∀y)¬S(x,y))) ∨ ¬(((∃y)R(x,y)) ∧ P(z)))",
      ),
    ).toBe(
      "(∀x)((((∀y)¬R(x,y)) ∨ ((∃y)S(x,y))) ∨ (((∀y)¬R(x,y)) ∨ ¬P(z)))",
    );
  });
});

describe("with unique bound variable names", () => {
  it("((∃x)¬P(x)) ∧ (((∀x)¬Q(x)) ∧ ((∃x)¬R(x)))", () => {
    expect(
      renameQuantifierVariablesFromString(
        "((∃x)¬P(x)) ∧ (((∀x)¬Q(x)) ∧ ((∃x)¬R(x)))",
      ),
    ).toBe("((∃x)¬P(x)) ∧ (((∀a)¬Q(a)) ∧ ((∃a₁)¬R(a₁)))");
  });

  it("((∀x)(∃y)P(x,y)) ∧ ((∀y)(∃x)¬P(y,x))", () => {
    expect(
      renameQuantifierVariablesFromString(
        "((∀x)(∃y)P(x,y)) ∧ ((∀y)(∃x)¬P(y,x))",
      ),
    ).toBe("((∀x)(∃y)P(x,y)) ∧ ((∀a)(∃a₁)¬P(a,a₁))");
  });
});

describe("to PNF ", () => {
  it("()", () => {
    expect(
      renameQuantifierVariablesFromString(
        "((∃x)¬P(x)) ∧ (((∀x)¬Q(x)) ∧ ((∃x)¬R(x)))",
      ),
    ).toBe("((∃x)¬P(x)) ∧ (((∀a)¬Q(a)) ∧ ((∃a₁)¬R(a₁)))");
  });
});


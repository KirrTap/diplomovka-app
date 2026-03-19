// examples.ts
// Mapovanie názvov príkladov na ich obsah
export const EXAMPLES: { labelKey: string; value: string }[] = [
  { 
    labelKey: "example_1", 
    value: `parent(jozo, jano).
parent(jozo, erik). 
parent(jozo, maria).
parent(maria, kika).
not_same(jano, maria).
not_same(jano, erik).
sibling(X, Y) :- parent(P, X), parent(P, Y), not_same(X, Y).
?- sibling(jano, S).` 
  },
  { labelKey: "example_2", value: "∃x (Q(x) ∧ R(x))" },
  { labelKey: "example_3", value: "∀x (P(x) => Q(x))" },
  { labelKey: "example_4", value: "((∀x)(C(x)=>S(x))∧(∃y)(C(y)∧P(y)))∧¬S(Punto)" },
  // Pridaj ďalšie príklady podľa potreby
];

// examples.ts
// Mapovanie názvov príkladov na ich obsah
export const EXAMPLES: { label: string; value: string }[] = [
  { 
    label: "Príklad 1", 
    value: `parent(jozo, jano).
parent(jozo, erik). 
parent(jozo, maria).
parent(maria, kika).
not_same(jano, maria).
not_same(jano, erik).
grandparent(X, Y) :- parent(X, Z), parent(Z, Y).
sibling(X, Y) :- parent(P, X), parent(P, Y), not_same(X, Y).
?- sibling(jano, S).` 
  },
  { label: "Príklad 2", value: "∃x (Q(x) ∧ R(x))" },
  { label: "Príklad 3", value: "∀x (P(x) => Q(x))" },
  { label: "Príklad 4", value: "((∀x)(C(x)=>S(x))∧(∃y)(C(y)∧P(y)))∧¬S(Punto)" },
  // Pridaj ďalšie príklady podľa potreby
];

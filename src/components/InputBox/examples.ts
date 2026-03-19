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
  { labelKey: "example_2", value: "(((P(x)∧S(x))=>K(x))∧(K(x)∧(L(x)∨O(x))=>B(x))∧P(j)∧S(j)∧L(j)∧O(j)∧P(m)∧S(m)∧L(m))=>B(S)" },
  // Pridaj ďalšie príklady podľa potreby
];

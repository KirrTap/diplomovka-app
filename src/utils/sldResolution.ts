export type Clause = string[];

export interface SLDResult {
  knowledgeBase: Clause[]; // Pravidlá a fakty
  goals: Clause[]; // Negatívne klauzuly (ciele)
}

/**
 * Rozdelí počiatočnú množinu klauzúl na bázu znalostí a ciele pre SLD rezolúciu.
 * Cieľ (Goal) je klauzula, v ktorej sú všetky literály negatívne (začínajú na ¬).
 * Báza znalostí (Knowledge Base) sú všetky ostatné klauzuly.
 */
export function prepareSLD(clauses: Clause[]): SLDResult {
  const knowledgeBase: Clause[] = [];
  const goals: Clause[] = [];

  for (const clause of clauses) {
    // Ak je klauzula prázdna, technicky je to spor, ale dáme to k cieľom
    if (clause.length === 0) {
      goals.push(clause);
      continue;
    }

    // Skontrolujeme, či sú všetky literály v klauzule negatívne
    let isGoalClause = true;
    for (const literal of clause) {
      // V našom systéme každý literál začína buď priamo na "¬", alebo je pozitívny.
      // (Pre istotu odstránime biele znaky zľava, ak by tam nejaké boli).
      if (!literal.trim().startsWith("¬")) {
        isGoalClause = false;
        break;
      }
    }

    if (isGoalClause) {
      goals.push(clause);
    } else {
      knowledgeBase.push(clause);
    }
  }

  return { knowledgeBase, goals };
}

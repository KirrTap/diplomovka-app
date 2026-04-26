export type Clause = string[];

export interface SLDResult {
  knowledgeBase: Clause[];
  goals: Clause[];
}

export function prepareSLD(clauses: Clause[]): SLDResult {
  const knowledgeBase: Clause[] = [];
  const goals: Clause[] = [];

  for (const clause of clauses) {
   
    if (clause.length === 0) {
      if (goals.length === 0) {
        goals.push(clause);
      } else {
        knowledgeBase.push(clause);
      }
      continue;
    }

    
    let isGoalClause = true;
    for (const literal of clause) {
      
      if (!literal.trim().startsWith("¬")) {
        isGoalClause = false;
        break;
      }
    }

    if (isGoalClause && goals.length === 0) {
      goals.push(clause);
    } else {
      knowledgeBase.push(clause);
    }
  }

  return { knowledgeBase, goals };
}

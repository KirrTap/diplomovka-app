import { parseLiteralToPredicate, unifyPredicates, applySubstitutionToPredicate, termToString, type Predicate, type Term } from "./unification";

export interface SLDNode {
  id: string;
  goals: Predicate[];     // Current resolvents (negative literals)
  parent?: string;        // Parent node ID
  usedRule?: string;      // The rule from KB used to get here
  subst?: Record<string, string>; // Substitutions made in this step
  status: "open" | "success" | "failure";
}

export interface SLDEdge {
  id: string;
  source: string;
  target: string;
  label: string; // The substitution or rule applied
}

export interface SLDTreeData {
  nodes: SLDNode[];
  edges: SLDEdge[];
}

export function generateSLDTreeDFS(knowledgeBase: string[][], initialGoals: string[][], maxDepth: number = 15): SLDTreeData {
  const nodes: SLDNode[] = [];
  const edges: SLDEdge[] = [];
  
  if (initialGoals.length === 0) return { nodes, edges };

  // Parse KB clauses into predicates
  // KB clause format: ["parent(jozo, jano)"] or ["¬parent(X, Z)", "¬parent(Z, Y)", "grandparent(X, Y)"]
  const kbParsed = knowledgeBase.map(clause => clause.map(parseLiteralToPredicate));
  
  // Initialize first node with the first goal clause
  // Goals are negative, e.g. ["¬grandparent(jozo, Y)"]
  const rootGoals = initialGoals[0].map(parseLiteralToPredicate);
  
  let nodeIdCounter = 0;
  
  const rootNode: SLDNode = {
    id: `n${nodeIdCounter++}`,
    goals: rootGoals,
    status: "open"
  };
  
  nodes.push(rootNode);

  // Helper to rename variables in a KB rule to prevent accidental clashes across steps
  // e.g. X becomes X_1, X_2 etc.
  function renameVariablesInClause(clause: Predicate[], suffix: number): Predicate[] {
    const renameTerm = (t: Term): Term => {
      if (t.type === "Variable") return { type: "Variable", name: `${t.name}_${suffix}` };
      if (t.type === "Function") return { type: "Function", name: t.name, args: t.args.map(renameTerm) };
      return t;
    };
    return clause.map(p => ({
      ...p,
      args: p.args.map(renameTerm)
    }));
  }

  // Recursive DFS
  function explore(node: SLDNode, depth: number) {
    if (depth >= maxDepth) {
      node.status = "failure"; // Cut off infinite loops
      return;
    }

    if (node.goals.length === 0) {
      node.status = "success"; // Empty clause -> proof found!
      return;
    }

    // Prolog standard: always resolve the FIRST goal (left-most)
    const currentGoal = node.goals[0];
    const remainingGoals = node.goals.slice(1);
    
    // Unify currentGoal with the POSITIVE literal of each KB clause
    // (A KB clause represents Head :- Body. Head is the positive literal).
    let hasChildren = false;

    for (let kbIdx = 0; kbIdx < kbParsed.length; kbIdx++) {
      const kbClause = renameVariablesInClause(kbParsed[kbIdx], nodeIdCounter);
      
      // Find the positive literal (the Head) in the KB clause
      const headIdx = kbClause.findIndex(p => !p.isNegated);
      if (headIdx === -1) continue; // Not a standard definite clause
      
      const head = kbClause[headIdx];
      
      // The goal is negative (e.g. ¬grandparent), the head is positive (e.g. grandparent).
      // We unify them ignoring the negation flag.
      const goalToUnify = { ...currentGoal, isNegated: false };
      
      const subst = unifyPredicates(goalToUnify, head);
      
      if (subst) {
        hasChildren = true;
        
        // Unification succeeded! Create new goals:
        // 1. Take the body of the KB clause (all negative literals)
        const kbBody = kbClause.filter((_, idx) => idx !== headIdx);
        // Change them to pure predicates without the explicit negation flag for resolution,
        // because in our SLD state array they implicitly represent "goals to prove"
        const newSubGoals = kbBody.map(p => ({ ...p, isNegated: true }));
        
        // 2. Add remaining original goals
        const nextGoalsUnsubstituted = [...newSubGoals, ...remainingGoals];
        
        // 3. Apply substitution to all next goals
        const nextGoals = nextGoalsUnsubstituted.map(g => applySubstitutionToPredicate(g, subst));
        
        const childId = `n${nodeIdCounter++}`;
        const childNode: SLDNode = {
          id: childId,
          goals: nextGoals,
          parent: node.id,
          status: nextGoals.length === 0 ? "success" : "open"
        };
        
        nodes.push(childNode);
        
        // Format substitution for the edge label
        const substStrings: string[] = [];
        const seenKeys = new Set<string>();

        subst.forEach((val, key) => {
           // Získame pôvodné meno premennej bez internej prípony (napr. X_1 -> X)
           const cleanKey = key.replace(/_\d+$/, "");
           const cleanVal = termToString(val);

           // Zobrazíme iba ak sa takáto premenná ešte nevyskytla, aby nevznikali duplikáty (napr X/jano a X/jano)
           if (!seenKeys.has(cleanKey)) {
             seenKeys.add(cleanKey);
             substStrings.push(`${cleanKey}/${cleanVal}`);
           }
        });
        
        const substStr = substStrings.length > 0 ? `{ ${substStrings.join(", ")} }` : "{}";
        
        edges.push({
          id: `e-${node.id}-${childId}`,
          source: node.id,
          target: childId,
          label: substStr
        });

        // Continue DFS
        explore(childNode, depth + 1);
      }
    }
    
    if (!hasChildren && node.goals.length > 0) {
      node.status = "failure"; // Dead end
    }
  }

  explore(rootNode, 0);

  return { nodes, edges };
}

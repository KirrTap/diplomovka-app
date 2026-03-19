import { parseLiteralToPredicate, unifyPredicates, applySubstitutionToPredicate, termToString, type Predicate, type Term } from "./unification";
import type { SLDNode, SLDEdge, SLDTreeData } from "./sldResolutionDFS";

export function generateSLDTreeBFS(knowledgeBase: string[][], initialGoals: string[][], maxDepth: number = 15): SLDTreeData {
  const nodes: SLDNode[] = [];
  const edges: SLDEdge[] = [];
  
  if (initialGoals.length === 0) return { nodes, edges };

  const kbParsed = knowledgeBase.map(clause => clause.map(parseLiteralToPredicate));
  const rootGoals = initialGoals[0].map(parseLiteralToPredicate);
  
  let nodeIdCounter = 0;
  
  const rootNode: SLDNode = {
    id: `n${nodeIdCounter++}`,
    goals: rootGoals,
    status: "open"
  };
  
  nodes.push(rootNode);

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

  const queue: { node: SLDNode; depth: number }[] = [{ node: rootNode, depth: 0 }];

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;

    if (depth >= maxDepth) {
      node.status = "failure";
      continue;
    }

    if (node.goals.length === 0) {
      node.status = "success";
      continue;
    }

    const currentGoal = node.goals[0];
    const remainingGoals = node.goals.slice(1);
    
    let hasChildren = false;

    for (let kbIdx = 0; kbIdx < kbParsed.length; kbIdx++) {
      const kbClause = renameVariablesInClause(kbParsed[kbIdx], nodeIdCounter);
      
      const headIdx = kbClause.findIndex(p => !p.isNegated);
      if (headIdx === -1) continue; 
      
      const head = kbClause[headIdx];
      
      const goalToUnify = { ...currentGoal, isNegated: false };
      
      const subst = unifyPredicates(goalToUnify, head);
      
      if (subst) {
        hasChildren = true;
        
        const kbBody = kbClause.filter((_, idx) => idx !== headIdx);
        const newSubGoals = kbBody.map(p => ({ ...p, isNegated: true }));
        
        const nextGoalsUnsubstituted = [...newSubGoals, ...remainingGoals];
        
        const nextGoals = nextGoalsUnsubstituted.map(g => applySubstitutionToPredicate(g, subst));
        
        const childId = `n${nodeIdCounter++}`;
        const childNode: SLDNode = {
          id: childId,
          goals: nextGoals,
          parent: node.id,
          usedClauseIndex: kbIdx,
          status: nextGoals.length === 0 ? "success" : "open"
        };
        
        nodes.push(childNode);
        
        const substStrings: string[] = [];
        const seenKeys = new Set<string>();

        subst.forEach((val, key) => {
           const cleanKey = key.replace(/_\d+$/, "");
           const cleanVal = termToString(val);

           if (!seenKeys.has(cleanKey)) {
             seenKeys.add(cleanKey);
             substStrings.push(`${cleanKey}/${cleanVal}`);
           }
        });
        
        const substStr = substStrings.length > 0 ? `{ ${substStrings.join(", ")} }` : "{ }";
        
        edges.push({
          id: `e-${node.id}-${childId}`,
          source: node.id,
          target: childId,
          label: substStr
        });

        queue.push({ node: childNode, depth: depth + 1 });
      }
    }
    
    if (!hasChildren && node.goals.length > 0) {
      node.status = "failure";
    }
  }

  return { nodes, edges };
}

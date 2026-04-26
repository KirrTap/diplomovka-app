import { parseLiteralToPredicate, unifyPredicates, applySubstitutionToPredicate, termToString, type Predicate, type Term } from "./unification";

export interface SLDNode {
  id: string;
  goals: Predicate[];     
  parent?: string;        
  usedRule?: string;      
  usedClauseIndex?: number;
  subst?: Record<string, string>; 
  status: "open" | "success" | "failure";
  isFailLabel?: boolean;  
}

export interface SLDEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface SLDTreeData {
  nodes: SLDNode[];
  edges: SLDEdge[];
  hitMaxDepth: boolean;
}

export function generateSLDTreeDFS(knowledgeBase: string[][], initialGoals: string[][], maxDepth: number = 15, variables: string[] = []): SLDTreeData {
  const nodes: SLDNode[] = [];
  const edges: SLDEdge[] = [];
  let hitMaxDepth = false;

  if (initialGoals.length === 0) return { nodes, edges, hitMaxDepth };

  const kbParsed = knowledgeBase.map(clause => clause.map(lit => parseLiteralToPredicate(lit, variables)));

  const rootGoals = initialGoals[0].map(lit => parseLiteralToPredicate(lit, variables));
  
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


  function explore(node: SLDNode, depth: number) {
    if (depth >= maxDepth) {
      node.status = "failure"; 
      hitMaxDepth = true;
      return;
    }

    if (node.goals.length === 0) {
      node.status = "success"; 
      return;
    }

    const currentGoal = node.goals[0];
    const remainingGoals = node.goals.slice(1);
    
    let hasChildren = false;

    for (let kbIdx = 0; kbIdx < kbParsed.length; kbIdx++) {
      const kbClause = renameVariablesInClause(kbParsed[kbIdx], nodeIdCounter);
      
      for (let headIdx = 0; headIdx < kbClause.length; headIdx++) {
        if (kbClause[headIdx].isNegated === currentGoal.isNegated) continue;
        
        const head = kbClause[headIdx];
        
        const goalToUnify = { ...currentGoal, isNegated: false };
        const headToUnify = { ...head, isNegated: false };
        
        const subst = unifyPredicates(goalToUnify, headToUnify);
        
        if (subst) {
          hasChildren = true;
          
          const kbBody = kbClause.filter((_, idx) => idx !== headIdx);

          const newSubGoals = kbBody.map(p => ({ ...p }));
        
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
               substStrings.push(`${cleanVal}/${cleanKey}`); 
             }
        });
        
        const substStr = substStrings.length > 0 ? `{ ${substStrings.join(", ")} }` : "{ }";
        
        edges.push({
          id: `e-${node.id}-${childId}`,
          source: node.id,
          target: childId,
          label: substStr
        });

        explore(childNode, depth + 1);
      }
      }
    }
    
    if (!hasChildren && node.goals.length > 0) {
      node.status = "failure";
    }
  }

  explore(rootNode, 0);

  return { nodes, edges, hitMaxDepth };
}

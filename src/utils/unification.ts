// Predicate structure: { name: string, args: Term[] }
// Term structure: { type: "Variable" | "Constant" | "Function", name: string, args?: Term[] }

export type Term = 
  | { type: "Variable"; name: string }
  | { type: "Constant"; name: string }
  | { type: "Function"; name: string; args: Term[] };

export interface Predicate {
  name: string;
  args: Term[];
  isNegated: boolean;
}

export type Substitution = Map<string, Term>;

export function parseLiteralToPredicate(literal: string): Predicate {
  let isNegated = false;
  let str = literal.trim();
  
  if (str.startsWith("¬")) {
    isNegated = true;
    str = str.substring(1).trim();
  }

  const openParenIdx = str.indexOf("(");
  if (openParenIdx === -1) {
    return { name: str, args: [], isNegated };
  }

  const name = str.substring(0, openParenIdx);
  const argsStr = str.substring(openParenIdx + 1, str.length - 1);
  
  function parseTermString(termStr: string): Term {
    termStr = termStr.trim();
    const openIdx = termStr.indexOf("(");
    
    // If it has parenthesis, it's a function
    if (openIdx !== -1 && termStr.endsWith(")")) {
      const funcName = termStr.substring(0, openIdx);
      const innerArgsStr = termStr.substring(openIdx + 1, termStr.length - 1);
      
      const innerArgs: string[] = [];
      let currentArg = "";
      let parenDepth = 0;
      
      for (let i = 0; i < innerArgsStr.length; i++) {
        const char = innerArgsStr[i];
        if (char === "(") parenDepth++;
        else if (char === ")") parenDepth--;
        
        if (char === "," && parenDepth === 0) {
          innerArgs.push(currentArg.trim());
          currentArg = "";
        } else {
          currentArg += char;
        }
      }
      if (currentArg.trim()) {
        innerArgs.push(currentArg.trim());
      }
      
      return {
        type: "Function",
        name: funcName,
        args: innerArgs.map(parseTermString)
      };
    }
    
    // Predicate variables logic: In some formalisms, variables are lowercase (x, y, z) 
    // BUT in Prolog they are uppercase.
    // Given your example f(x1,x3,x2), x1, x2, x3 are obviously meant to be VARIABLES!
    // Let's treat it as a variable if it's an isolated lowercase 'x', 'y', 'z' (possibly with numbers) 
    // OR if it starts with an Uppercase letter.
    if (termStr.match(/^[A-Z]/) || termStr.match(/^[xyz]\d*$/i)) {
      return { type: "Variable", name: termStr };
    }
    
    return { type: "Constant", name: termStr };
  }

  const args: string[] = [];
  let currentArg = "";
  let parenDepth = 0;
  
  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    if (char === "(") parenDepth++;
    else if (char === ")") parenDepth--;
    
    if (char === "," && parenDepth === 0) {
      args.push(currentArg.trim());
      currentArg = "";
    } else {
      currentArg += char;
    }
  }
  if (currentArg.trim()) {
    args.push(currentArg.trim());
  }

  return { 
    name, 
    args: args.map(parseTermString), 
    isNegated 
  };
}

export function unifyTerms(t1: Term, t2: Term, subst: Substitution): boolean {
  if (t1.type === "Variable") {
    return unifyVariable(t1.name, t2, subst);
  }
  if (t2.type === "Variable") {
    return unifyVariable(t2.name, t1, subst);
  }
  
  if (t1.type === "Constant" && t2.type === "Constant") {
    return t1.name === t2.name;
  }
  
  if (t1.type === "Function" && t2.type === "Function") {
    if (t1.name !== t2.name || t1.args.length !== t2.args.length) {
      return false;
    }
    for (let i = 0; i < t1.args.length; i++) {
      // Need to apply current substitution to terms before unifying them
      const arg1 = applySubstitutionToTerm(t1.args[i], subst);
      const arg2 = applySubstitutionToTerm(t2.args[i], subst);
      if (!unifyTerms(arg1, arg2, subst)) {
        return false;
      }
    }
    return true;
  }
  
  return false;
}

function unifyVariable(varName: string, term: Term, subst: Substitution): boolean {
  if (subst.has(varName)) {
    return unifyTerms(subst.get(varName)!, term, subst);
  }
  
  if (term.type === "Variable" && subst.has(term.name)) {
    return unifyTerms({ type: "Variable", name: varName }, subst.get(term.name)!, subst);
  }
  
  // Occurs check (skip for simplicity unless needed, standard Prolog omits it)
  
  subst.set(varName, term);
  return true;
}

export function unifyPredicates(p1: Predicate, p2: Predicate): Substitution | null {
  if (p1.name !== p2.name || p1.args.length !== p2.args.length) {
    return null; // Cannot unify
  }
  
  const subst: Substitution = new Map();
  
  for (let i = 0; i < p1.args.length; i++) {
    const t1 = p1.args[i];
    const t2 = p2.args[i];
    
    if (!unifyTerms(t1, t2, subst)) {
      return null;
    }
  }
  
  return subst;
}

export function applySubstitutionToTerm(term: Term, subst: Substitution): Term {
  if (term.type === "Variable") {
    if (subst.has(term.name)) {
      // Recursively apply to handle chained substitutions X->Y, Y->a
      return applySubstitutionToTerm(subst.get(term.name)!, subst);
    }
    return term;
  }
  if (term.type === "Function") {
    return {
      type: "Function",
      name: term.name,
      args: term.args.map(a => applySubstitutionToTerm(a, subst))
    };
  }
  return term;
}

export function applySubstitutionToPredicate(p: Predicate, subst: Substitution): Predicate {
  return {
    ...p,
    args: p.args.map(arg => applySubstitutionToTerm(arg, subst))
  };
}

export function termToString(t: Term): string {
  if (t.type === "Function") {
    return `${t.name}(${t.args.map(termToString).join(", ")})`;
  }
  // Remove the internal _number suffix for visualization (e.g., X_1 -> X)
  return t.name.replace(/_\d+$/, "");
}

export function predicateToString(p: Predicate): string {
  const nameStr = p.isNegated ? `¬${p.name}` : p.name;
  if (p.args.length === 0) return nameStr;
  
  const argsStr = p.args.map(termToString).join(", ");
  
  return `${nameStr}(${argsStr})`;
}

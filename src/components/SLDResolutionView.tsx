import { useMemo } from "react";
import { decideLogicType, type LogicToken } from "../utils/tokenizer";
import { parseStandardFormula } from "../utils/parserStandard";
import { parsePrologFormula } from "../utils/parserProlog";
import {
  negateFormula,
  replaceImplies,
  toNNF,
  renameQuantifierVariables,
  toPNF,
  skolemize,
  removeForallQuantifiers,
  toCNF,
  flattenCNF,
} from "../utils/transformSteps";
import { prepareSLD } from "../utils/sldResolution";
import { SLDTree } from "./SLDTree";

interface SLDResolutionViewProps {
  tokens: LogicToken[];
}

export const SLDResolutionView = ({ tokens }: SLDResolutionViewProps) => {
  const goals = useMemo(() => {
    try {
      const type = decideLogicType(tokens);
      if (type === "sekvent") return null;

      const ast = type === "prolog" ? parsePrologFormula(tokens) : parseStandardFormula(tokens);
      const negated = negateFormula(ast);
      const withoutImplies = replaceImplies(negated);
      const nnf = toNNF(withoutImplies);
      const nnfUniqueVars = renameQuantifierVariables(nnf);
      const pnf = toPNF(nnfUniqueVars);
      const skolemized = skolemize(pnf);
      const removedForall = removeForallQuantifiers(skolemized);
      const cnf = toCNF(removedForall);
      const clauses = flattenCNF(cnf);
      
      const sld = prepareSLD(clauses);
      return sld.goals;
    } catch {
      return null;
    }
  }, [tokens]);

  if (!goals || goals.length === 0) return null;

  return (
    <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
        SLD Resolution Tree
      </h2>
      <SLDTree goals={goals} />
    </div>
  );
};

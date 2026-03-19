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
import { generateSLDTreeDFS } from "../utils/sldResolutionDFS";
import { generateSLDTreeBFS } from "../utils/sldResolutionBFS";
import { SLDTree } from "./SLDTree";

interface SLDResolutionViewProps {
  tokens: LogicToken[];
  strategy: "dfs" | "bfs";
}

export const SLDResolutionView = ({ tokens, strategy }: SLDResolutionViewProps) => {
  const treeData = useMemo(() => {
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
      if (strategy === "bfs") {
        return generateSLDTreeBFS(sld.knowledgeBase, sld.goals);
      } else {
        return generateSLDTreeDFS(sld.knowledgeBase, sld.goals);
      }
    } catch {
      return null;
    }
  }, [tokens, strategy]);

  if (!treeData || treeData.nodes.length === 0) return null;

  return (
    <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <SLDTree treeData={treeData} />
    </div>
  );
};

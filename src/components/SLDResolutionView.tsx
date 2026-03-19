import { useMemo, useRef, useEffect, useState } from "react";
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
import { useLanguage } from "../translations/LanguageContext";
import { predicateToString } from "../utils/unification";

interface SLDResolutionViewProps {
  tokens: LogicToken[];
  strategy: "dfs" | "bfs";
}

export const SLDResolutionView = ({ tokens, strategy }: SLDResolutionViewProps) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleSteps, setVisibleSteps] = useState<number>(1);

  const resolutionData = useMemo(() => {
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
      let treeData;
      if (strategy === "bfs") {
        treeData = generateSLDTreeBFS(sld.knowledgeBase, sld.goals);
      } else {
        treeData = generateSLDTreeDFS(sld.knowledgeBase, sld.goals);
      }
      return { treeData, knowledgeBase: sld.knowledgeBase, goals: sld.goals };
    } catch {
      return null;
    }
  }, [tokens, strategy]);

  useEffect(() => {
    setVisibleSteps(1); // Reset steps when formula changes
    if (resolutionData && resolutionData.treeData && resolutionData.treeData.nodes.length > 0) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [resolutionData]);

  if (!resolutionData || !resolutionData.treeData || resolutionData.treeData.nodes.length === 0) return null;

  const { treeData, knowledgeBase, goals } = resolutionData;
  const initialClauses = [...goals, ...knowledgeBase];
  const visibleNodes = treeData.nodes.slice(0, visibleSteps);

  // Vytvoríme mapovanie ID uzla na číslo kroku v tabuľke.
  // Začiatočný cieľ (koreň) má číslo 1. Nové rezolventy majú čísla od initialClauses.length + 1.
  const stepMap: Record<string, number> = {};
  if (treeData.nodes.length > 0) {
    stepMap[treeData.nodes[0].id] = 1;
    treeData.nodes.slice(1).forEach((n, i) => {
      stepMap[n.id] = initialClauses.length + i + 1;
    });
  }

  return (
    <div ref={containerRef} className="flex w-full gap-4 scroll-mt-6">
      <div className="w-[60%] flex flex-col">
        <SLDTree treeData={treeData} visibleSteps={visibleSteps} setVisibleSteps={setVisibleSteps} />
      </div>

      <div className="w-[40%] bg-white p-6 rounded-xl shadow-lg border border-gray-200 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
        <h3 className="font-semibold text-gray-700 mb-4">{t("resolution_trace")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-gray-300 shadow-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-2 font-semibold text-gray-700 whitespace-nowrap w-12 text-center">{t("stepper.step")}</th>
                <th className="border border-gray-300 p-2 font-semibold text-gray-700">{t("clause")}</th>
                <th className="border border-gray-300 p-2 font-semibold text-gray-700 text-center whitespace-nowrap">{t("resolved_with")}</th>
                <th className="border border-gray-300 p-2 font-semibold text-gray-700 text-center">{t("unification")}</th>
              </tr>
            </thead>
            <tbody>
              {/* Zobrazenie počiatočných klauzúl (najprv ciele, potom báza znalostí) */}
              {initialClauses.map((clause, idx) => (
                <tr key={`init-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="border border-gray-300 p-2 text-gray-600 font-medium text-center bg-gray-50/50">{idx + 1}</td>
                  <td className="border border-gray-300 p-2 font-mono text-sm break-all text-gray-800">
                    {clause.join(", ")}
                  </td>
                  <td className="border border-gray-300 p-2 text-gray-400 font-medium text-center">-</td>
                  <td className="border border-gray-300 p-2 text-gray-400 font-medium text-center">-</td>
                </tr>
              ))}
              
              {/* Zobrazenie rezolventov odvodených zo stromu (odrezaná hlava = cieľová klauzula, ktorá je už vypísaná ako #1) */}
              {visibleNodes.slice(1).map((node, idx) => {
                let resolventText = "";
                let isSpecial = false;

                if (node.goals.length === 0) {
                  resolventText = "□";
                  isSpecial = true;
                } else {
                  resolventText = node.goals.map(g => predicateToString(g)).join(", ");
                }

                const parentStep = node.parent ? stepMap[node.parent] : '?';
                const kbStep = node.usedClauseIndex !== undefined ? goals.length + node.usedClauseIndex + 1 : '?';
                const resolvedWithText = node.isFailLabel ? "-" : `${parentStep},${kbStep}`;
                
                const edge = treeData.edges.find(e => e.target === node.id);
                const unificationText = edge && edge.label ? edge.label : "-";
                // If the unification was exactly "{}", change it to "{ }" for readability
                const displayUnificationText = unificationText === "{}" ? "{ }" : unificationText;

                return (
                  <tr key={node.id} className="bg-blue-50/30 hover:bg-blue-50 transition-colors">
                    <td className="border border-gray-300 p-2 text-blue-600 font-medium text-center bg-blue-50/50">{initialClauses.length + idx + 1}</td>
                    <td className={`border border-gray-300 p-2 font-mono text-sm break-all ${isSpecial ? (node.isFailLabel ? 'text-red-600 font-bold' : 'text-black font-bold') : 'text-gray-800'}`}>
                      {resolventText}
                    </td>
                    <td className="border border-gray-300 p-2 text-gray-600 font-mono text-sm text-center whitespace-nowrap">{resolvedWithText}</td>
                    <td className="border border-gray-300 p-2 text-gray-800 font-mono text-sm text-center break-all">{displayUnificationText}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

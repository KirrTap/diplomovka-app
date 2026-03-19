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
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

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
    setHighlightedNodeId(null); // Reset highlighted node
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

  const formatWithBreaks = (text: string) => {
    return text.split(",").map((part, i, arr) => (
      <span key={i}>
        {part}
        {i < arr.length - 1 && <>,&#8203;</>}
      </span>
    ));
  };

  return (
    <div ref={containerRef} className="flex w-full gap-4 scroll-mt-6">
      <div className="w-[60%] flex flex-col">
        <SLDTree treeData={treeData} visibleSteps={visibleSteps} setVisibleSteps={setVisibleSteps} highlightedNodeId={highlightedNodeId} />
      </div>

      <div className="w-[40%] flex flex-col bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-[757px]">
        <h3 className="font-semibold text-gray-700 mb-4 flex-shrink-0">{t("resolution_trace")}</h3>
        <div className="flex-1 overflow-auto rounded-lg shadow-sm border border-gray-300">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 shadow-[0_1px_0_#d1d5db]">
              <tr>
                <th className="bg-gray-100 border-b border-r border-gray-300 p-2 font-semibold text-gray-700 whitespace-nowrap w-12 text-center">{t("table_number")}</th>
                <th className="bg-gray-100 border-b border-r border-gray-300 p-2 font-semibold text-gray-700 whitespace-nowrap w-12 text-center" title={t("tree_node")}>{t("tree_node")}</th>
                <th className="bg-gray-100 border-b border-r border-gray-300 p-2 font-semibold text-gray-700">{t("clause")}</th>
                <th className="bg-gray-100 border-b border-r border-gray-300 p-2 font-semibold text-gray-700 text-center whitespace-nowrap">{t("resolved_with")}</th>
                <th className="bg-gray-100 border-b border-gray-300 p-2 font-semibold text-gray-700 text-center">{t("unification")}</th>
              </tr>
            </thead>
            <tbody>
              {/* Zobrazenie počiatočných klauzúl (najprv ciele, potom báza znalostí) */}
              {initialClauses.map((clause, idx) => {
                const isRootGoal = idx === 0;
                const nodeId = isRootGoal && treeData.nodes.length > 0 ? treeData.nodes[0].id : null;
                const isHighlighted = highlightedNodeId && nodeId === highlightedNodeId;
                
                return (
                  <tr 
                    key={`init-${idx}`} 
                    className={`transition-colors ${nodeId ? 'cursor-pointer' : ''} ${isHighlighted ? 'bg-blue-200 hover:bg-blue-300' : 'hover:bg-gray-50'}`}
                    onClick={() => nodeId && setHighlightedNodeId(prev => prev === nodeId ? null : nodeId)}
                  >
                    <td className={`border-b border-r border-gray-300 p-2 text-gray-800 font-medium text-center ${isHighlighted ? 'bg-blue-300/50' : 'bg-gray-50/50'}`}>{idx + 1}</td>
                    <td className={`border-b border-r border-gray-300 p-2 text-gray-800 font-medium text-center ${isHighlighted ? 'bg-blue-300/30' : ''}`}>{isRootGoal ? "1" : ""}</td>
                    <td className="border-b border-r border-gray-300 p-2 font-mono text-sm break-words text-gray-800">
                      {formatWithBreaks(clause.join(", "))}
                    </td>
                    <td className="border-b border-r border-gray-300 p-2 text-gray-800 font-medium text-center"></td>
                    <td className="border-b border-gray-300 p-2 text-gray-800 font-medium text-center"></td>
                  </tr>
                );
              })}
              
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
                const resolvedWithText = node.isFailLabel ? "" : `${parentStep},${kbStep}`;
                
                const edge = treeData.edges.find(e => e.target === node.id);
                const unificationText = edge && edge.label ? edge.label : "";
                // If the unification was exactly "{}", change it to "{ }" for readability
                const displayUnificationText = unificationText === "{}" ? "{ }" : unificationText;
                
                const isHighlighted = highlightedNodeId === node.id;

                return (
                  <tr 
                    key={node.id} 
                    className={`transition-colors cursor-pointer ${isHighlighted ? 'bg-blue-200 hover:bg-blue-300' : 'bg-blue-50/30 hover:bg-blue-50'}`}
                    onClick={() => setHighlightedNodeId(prev => prev === node.id ? null : node.id)}
                  >
                    <td className={`border-b border-r border-gray-300 p-2 text-gray-800 font-medium text-center ${isHighlighted ? 'bg-blue-300/50' : 'bg-blue-50/50'}`}>{initialClauses.length + idx + 1}</td>
                    <td className={`border-b border-r border-gray-300 p-2 text-gray-800 font-medium text-center ${isHighlighted ? 'bg-blue-300/30' : 'bg-blue-50/20'}`}>{idx + 2}</td>
                    <td className={`border-b border-r border-gray-300 p-2 font-mono text-sm break-words ${isSpecial ? (node.isFailLabel ? 'text-red-600 font-bold' : 'text-black font-bold') : 'text-gray-800'}`}>
                      {formatWithBreaks(resolventText)}
                    </td>
                    <td className="border-b border-r border-gray-300 p-2 text-gray-800 font-mono text-sm text-center whitespace-nowrap">{resolvedWithText}</td>
                    <td className="border-b border-gray-300 p-2 text-gray-800 font-mono text-sm text-center break-words">{formatWithBreaks(displayUnificationText)}</td>
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

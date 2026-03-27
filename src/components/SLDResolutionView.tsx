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
import { FaCopy } from "react-icons/fa";

interface SLDResolutionViewProps {
  tokens: LogicToken[];
  strategy: "dfs" | "bfs";
  onStrategyChange: (strategy: "dfs" | "bfs") => void;
}

export const SLDResolutionView = ({ tokens, strategy, onStrategyChange }: SLDResolutionViewProps) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleSteps, setVisibleSteps] = useState<number>(1);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  // LaTeX modal state
  const [isLatexModalOpen, setIsLatexModalOpen] = useState(false);
  const [latexExportType, setLatexExportType] = useState<'document' | 'table'>('table');
  const [latexOrientation, setLatexOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const resolutionData = useMemo(() => {
    try {
      const type = decideLogicType(tokens);
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

  useEffect(() => {
    if (highlightedNodeId) {
      // Scroll table row into view
      const row = document.getElementById(`row-${highlightedNodeId}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Ensure node is visible in tree
      if (resolutionData?.treeData) {
        const nodeIndex = resolutionData.treeData.nodes.findIndex(n => n.id === highlightedNodeId);
        if (nodeIndex !== -1 && nodeIndex + 1 > visibleSteps) {
          setVisibleSteps(nodeIndex + 1);
        }
      }
    }
  }, [highlightedNodeId, resolutionData, visibleSteps]);

  const copyToLatex = () => {
    setIsLatexModalOpen(true);
  };

  const handleConfirmLatexCopy = () => {
    if (!resolutionData || !resolutionData.treeData) return;

    const { treeData, knowledgeBase, goals } = resolutionData;
    const initialClauses = [...goals, ...knowledgeBase];
    const visibleNodes = treeData.nodes.slice(0, visibleSteps);
    const stepMap: Record<string, number> = {};
    if (treeData.nodes.length > 0) {
      stepMap[treeData.nodes[0].id] = 1;
      treeData.nodes.slice(1).forEach((n, i) => {
        stepMap[n.id] = initialClauses.length + i + 1;
      });
    }

    let latex = "";
    
    if (latexExportType === 'table') {
      latex += `% ${t("latex_export_warning")}\n`;
      latex += `% \\usepackage{amssymb}\n`;
      latex += `% \\usepackage{longtable}\n`;
      if (latexOrientation === 'landscape') {
        latex += `% \\usepackage{pdflscape}\n`;
      }
      latex += `\n`;
    }

    if (latexExportType === 'document') {
      const margin = latexOrientation === 'landscape' ? '[a4paper, margin=1cm]' : '[a4paper, margin=1cm]';
      latex += `\\documentclass{article}
\\usepackage{amssymb}
\\usepackage${margin}{geometry}
\\usepackage{longtable}
${latexOrientation === 'landscape' ? '\\usepackage{pdflscape}\n' : ''}
\\begin{document}

`;
    }

    if (latexOrientation === 'landscape') {
      latex += `\\begin{landscape}\n`;
    }

    latex += `\\begin{longtable}{|c|l|c|c|}
\\hline
\\textbf{Step} & \\textbf{Clause} & \\textbf{Resolved} & \\textbf{Unification} \\\\
\\hline
\\endhead
`;

    // Initial clauses
    initialClauses.forEach((clause, idx) => {
      const clauseLatex = clause.join(", ").replace(/[~¬]/g, '\\neg ').replace(/_/g, '\\_');
      latex += `${idx + 1} & $${clauseLatex}$ & & \\\\\n\\hline\n`;
    });

    // Derived steps
    visibleNodes.slice(1).forEach((node, idx) => {
      let resolventText = "";
      if (node.goals.length === 0) {
        resolventText = "\\Box";
      } else {
        resolventText = node.goals.map(g => predicateToString(g)).join(", ").replace(/[~¬]/g, '\\neg ').replace(/_/g, '\\_');
      }

      const parentStep = node.parent ? stepMap[node.parent] : '?';
      const kbStep = node.usedClauseIndex !== undefined ? goals.length + node.usedClauseIndex + 1 : '?';
      const resolvedWithText = node.isFailLabel ? "" : `${parentStep},${kbStep}`;
      
      const edge = treeData.edges.find(e => e.target === node.id);
      const unificationText = edge && edge.label ? edge.label : "";
      const displayUnificationText = unificationText === "{}" ? "\\{\\}" : unificationText.replace(/{/g, "\\{").replace(/}/g, "\\}").replace(/_/g, '\\_');

      latex += `${initialClauses.length + idx + 1} & $${resolventText}$ & ${resolvedWithText} & $${displayUnificationText}$ \\\\\n\\hline\n`;
    });

    latex += `\\end{longtable}`;

    if (latexOrientation === 'landscape') {
      latex += `\n\\end{landscape}`;
    }

    if (latexExportType === 'document') {
      latex += `

\\end{document}`;
    }

    navigator.clipboard.writeText(latex);
    setIsLatexModalOpen(false);
  };

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
    <div ref={containerRef} className="flex flex-col lg:flex-row w-full gap-4 scroll-mt-6">
      <div className="w-full lg:w-[60%] flex flex-col">
        <SLDTree 
          treeData={treeData} 
          visibleSteps={visibleSteps} 
          setVisibleSteps={setVisibleSteps} 
          highlightedNodeId={highlightedNodeId}
          onNodeClick={(nodeId) => {
            setHighlightedNodeId(prev => prev === nodeId ? null : nodeId);
          }}
          strategy={strategy}
          onStrategyChange={onStrategyChange}
        />
      </div>

      <div className="w-full lg:w-[40%] flex flex-col bg-white p-6 rounded-xl shadow-lg border border-gray-200 min-h-[500px] lg:h-[757px]">
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <h3 className="font-bold text-lg text-gray-700">{t("resolution_trace")}</h3>
          <button 
            onClick={copyToLatex}
            className="p-2 ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t("export_table_latex")}
          >
            <FaCopy className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto rounded-lg shadow-sm border border-gray-300">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 shadow-[0_1px_0_#d1d5db]">
              <tr>
                <th className="bg-gray-100 border-b border-r border-gray-300 p-2 font-semibold text-gray-700 whitespace-nowrap w-12 text-center">{t("table_number")}</th>
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
                    id={nodeId ? `row-${nodeId}` : undefined}
                    key={`init-${idx}`} 
                    className={`transition-colors ${nodeId ? 'cursor-pointer' : 'cursor-not-allowed bg-gray-50'} ${isHighlighted ? 'bg-blue-200 hover:bg-blue-300' : (nodeId ? 'hover:bg-gray-50' : '')}`}
                    onClick={() => nodeId && setHighlightedNodeId(prev => prev === nodeId ? null : nodeId)}
                  >
                    <td className={`border-b border-r border-gray-300 p-2 font-medium text-center ${isHighlighted ? 'bg-blue-300/50 text-gray-800' : (nodeId ? 'bg-gray-50/50 text-gray-800' : 'bg-gray-100/50 text-gray-400')}`}>{idx + 1}</td>
                    <td className={`border-b border-r border-gray-300 p-2 font-mono text-sm break-words ${nodeId ? 'text-gray-800' : 'text-gray-400'}`}>
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
                    id={`row-${node.id}`}
                    key={node.id} 
                    className={`transition-colors cursor-pointer ${isHighlighted ? 'bg-blue-200 hover:bg-blue-300' : 'bg-blue-50/30 hover:bg-blue-50'}`}
                    onClick={() => setHighlightedNodeId(prev => prev === node.id ? null : node.id)}
                  >
                    <td className={`border-b border-r border-gray-300 p-2 text-gray-800 font-medium text-center ${isHighlighted ? 'bg-blue-300/50' : 'bg-blue-50/50'}`}>{initialClauses.length + idx + 1}</td>
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

      {isLatexModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800">{t("export_latex_title")}</h3>
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-gray-700">{t("export_latex_scope")}</label>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center text-gray-700 cursor-pointer">
                  <input type="radio" value="table" checked={latexExportType === 'table'} onChange={() => setLatexExportType('table')} className="mr-2 cursor-pointer" />
                  {t("export_latex_table_only")}
                </label>
                <label className="inline-flex items-center text-gray-700 cursor-pointer">
                  <input type="radio" value="document" checked={latexExportType === 'document'} onChange={() => setLatexExportType('document')} className="mr-2 cursor-pointer" />
                  {t("export_latex_full_document")}
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-semibold text-gray-700">{t("export_latex_orientation")}</label>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center text-gray-700 cursor-pointer">
                  <input type="radio" value="portrait" checked={latexOrientation === 'portrait'} onChange={() => setLatexOrientation('portrait')} className="mr-2 cursor-pointer" />
                  {t("export_latex_portrait")}
                </label>
                <label className="inline-flex items-center text-gray-700 cursor-pointer">
                  <input type="radio" value="landscape" checked={latexOrientation === 'landscape'} onChange={() => setLatexOrientation('landscape')} className="mr-2 cursor-pointer" />
                  {t("export_latex_landscape")}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors" onClick={() => setIsLatexModalOpen(false)}>{t("cancel")}</button>
              <button className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors" onClick={handleConfirmLatexCopy}>{t("copy")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

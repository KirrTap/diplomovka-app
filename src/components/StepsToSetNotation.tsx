import { useMemo, useState, useEffect } from "react";
import { stringifyAST, parseStandardFormula } from "../utils/parserStandard";
import { parsePrologFormula } from "../utils/parserProlog";
import { decideLogicType, type LogicToken } from "../utils/tokenizer";
import {
  negateFormula,
  stringifyNegated,
  toNNF,
  replaceImplies,
  renameQuantifierVariables,
  toPNF,
  skolemize,
  removeForallQuantifiers,
  toCNF,
  flattenCNF,
} from "../utils/transformSteps";
import { useLanguage } from "../translations/LanguageContext";

interface StepsToSetNotationProps {
  tokens: LogicToken[];
  onError: (message: string) => void;
}

export const StepsToSetNotation = ({
  tokens,
  onError,
}: StepsToSetNotationProps) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  // Collapse when processing new tokens
  useEffect(() => {
    setIsExpanded(false);
  }, [tokens]);

  const results = useMemo(() => {
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

      return {
        parsed: stringifyAST(ast),
        negated: stringifyNegated(negated),
        noImplies: stringifyAST(withoutImplies),
        nnf: stringifyAST(nnf),
        nnfUniqueVars: stringifyAST(nnfUniqueVars),
        pnf: stringifyAST(pnf),
        skolemized: stringifyAST(skolemized),
        removedForall: stringifyAST(removedForall),
        cnf: stringifyAST(cnf),
        clauses: clauses,
      };
    } catch (e: unknown) {
      if (e instanceof Error) {
        onError(e.message);
      } else {
        onError(String(e));
      }
      return null;
    }
  }, [tokens, onError]);

  if (!results) return null;

  return (
    <div className="mt-6 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex justify-between items-center text-left text-lg font-semibold text-gray-700 ${isExpanded ? 'mb-4' : ''} transition-colors focus:outline-none`}
      >
        <span>{t("transformation_steps")}</span>
        <svg 
          className={`w-6 h-6 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-6 mt-6 pb-2">
          
          <div className="relative">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[31px] top-1.5 ring-4 ring-white"></div>
            <h3 className="font-semibold text-gray-800 text-sm">{t("parsed_formula")}</h3>
            <div className="mt-2 p-3 bg-gray-50/80 rounded-lg font-mono text-sm border border-gray-200 shadow-sm text-gray-700 overflow-x-auto">
              {results.parsed}
            </div>
          </div>

          <div className="relative">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[31px] top-1.5 ring-4 ring-white"></div>
            <h3 className="font-semibold text-gray-800 text-sm">
              {t("negated_formula")}
            </h3>
            <div className="mt-2 p-3 bg-gray-50/80 rounded-lg font-mono text-sm border border-gray-200 shadow-sm text-gray-700 overflow-x-auto">
              {results.negated}
            </div>
          </div>

          <div className="relative">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[31px] top-1.5 ring-4 ring-white"></div>
            <h3 className="font-semibold text-gray-800 text-sm">
              {t("removed_implies")}
            </h3>
            <div className="mt-2 p-3 bg-gray-50/80 rounded-lg font-mono text-sm border border-gray-200 shadow-sm text-gray-700 overflow-x-auto">
              {results.noImplies}
            </div>
          </div>

          <div className="relative">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[31px] top-1.5 ring-4 ring-white"></div>
            <h3 className="font-semibold text-gray-800 text-sm">{t("nnf_formula")}</h3>
            <div className="mt-2 p-3 bg-gray-50/80 rounded-lg font-mono text-sm border border-gray-200 shadow-sm text-gray-700 overflow-x-auto">
              {results.nnf}
            </div>
          </div>

          <div className="relative">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[31px] top-1.5 ring-4 ring-white"></div>
            <h3 className="font-semibold text-gray-800 text-sm">
              {t("nnf_unique_vars")}
            </h3>
            <div className="mt-2 p-3 bg-gray-50/80 rounded-lg font-mono text-sm border border-gray-200 shadow-sm text-gray-700 overflow-x-auto">
              {results.nnfUniqueVars}
            </div>
          </div>

          <div className="relative">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[31px] top-1.5 ring-4 ring-white"></div>
            <h3 className="font-semibold text-gray-800 text-sm">{t("pnf_formula")}</h3>
            <div className="mt-2 p-3 bg-gray-50/80 rounded-lg font-mono text-sm border border-gray-200 shadow-sm text-gray-700 overflow-x-auto">
              {results.pnf}
            </div>
          </div>

          <div className="relative">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[31px] top-1.5 ring-4 ring-white"></div>
            <h3 className="font-semibold text-gray-800 text-sm">{t("skolem_formula")}</h3>
            <div className="mt-2 p-3 bg-gray-50/80 rounded-lg font-mono text-sm border border-gray-200 shadow-sm text-gray-700 overflow-x-auto">
              {results.skolemized}
            </div>
          </div>

          <div className="relative">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[31px] top-1.5 ring-4 ring-white"></div>
            <h3 className="font-semibold text-gray-800 text-sm">
              {t("removed_quantifiers")}
            </h3>
            <div className="mt-2 p-3 bg-gray-50/80 rounded-lg font-mono text-sm border border-gray-200 shadow-sm text-gray-700 overflow-x-auto">
              {results.removedForall}
            </div>
          </div>

          <div className="relative">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[31px] top-1.5 ring-4 ring-white"></div>
            <h3 className="font-semibold text-gray-800 text-sm">{t("cnf_formula")}</h3>
            <div className="mt-2 p-3 bg-gray-50/80 rounded-lg font-mono text-sm border border-gray-200 shadow-sm text-gray-700 overflow-x-auto">
              {results.cnf}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-[33px] top-3 h-[calc(100%+20px)] w-4 bg-white"></div>
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[31px] top-1.5 ring-4 ring-white"></div>
            <h3 className="font-semibold text-gray-800 text-sm">{t("clause_set")}</h3>
            <div className="mt-2 p-3 bg-gray-50/80 rounded-lg font-mono text-sm border border-gray-200 shadow-sm text-gray-700 overflow-x-auto">
              <span>{"{"}</span>
              {results.clauses.map((clause, idx) => (
                <span key={idx}>
                  <span>{"{"}</span>
                  {clause.map((lit, lIdx) => (
                    <span key={lIdx}>
                      <span>{lit}</span>
                      {lIdx < clause.length - 1 && <span>, </span>}
                    </span>
                  ))}
                  <span>{"}"}</span>
                  {idx < results.clauses.length - 1 && <span>, </span>}
                </span>
              ))}
              <span>{"}"}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

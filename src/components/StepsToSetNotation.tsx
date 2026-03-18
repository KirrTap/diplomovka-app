import { useMemo } from "react";
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
import { prepareSLD } from "../utils/sldResolution";
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

  const results = useMemo(() => {
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
      const { goals } = prepareSLD(clauses);

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
        goals: goals,
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
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
        {t("transformation_steps")}
      </h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-blue-600">{t("parsed_formula")}</h3>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm border border-gray-200">
            {results.parsed}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-blue-600">
            {t("negated_formula")}
          </h3>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm border border-gray-200">
            {results.negated}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-blue-600">
            {t("removed_implies")}
          </h3>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm border border-gray-200">
            {results.noImplies}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-blue-600">{t("nnf_formula")}</h3>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm border border-gray-200">
            {results.nnf}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-blue-600">
            {t("nnf_unique_vars")}
          </h3>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm border border-gray-200">
            {results.nnfUniqueVars}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-blue-600">{t("pnf_formula")}</h3>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm border border-gray-200">
            {results.pnf}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-blue-600">{t("skolem_formula")}</h3>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm border border-gray-200">
            {results.skolemized}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-blue-600">
            {t("removed_quantifiers")}
          </h3>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm border border-gray-200">
            {results.removedForall}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-blue-600">{t("cnf_formula")}</h3>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm border border-gray-200">
            {results.cnf}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-blue-600">{t("clause_set")}</h3>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm border border-gray-200 text-gray-900">
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

        <div>
          <h3 className="font-semibold text-red-600">{t("goals")}</h3>
          <div className="mt-2 p-3 bg-red-50 rounded-lg font-mono text-sm border border-red-200 text-red-900">
            <span>{"{"}</span>
            {results.goals.map((clause, idx) => (
              <span key={idx}>
                <span>{"{"}</span>
                {clause.map((lit, lIdx) => (
                  <span key={lIdx}>
                    <span>{lit}</span>
                    {lIdx < clause.length - 1 && <span>, </span>}
                  </span>
                ))}
                <span>{"}"}</span>
                {idx < results.goals.length - 1 && <span>, </span>}
              </span>
            ))}
            <span>{"}"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useMemo } from "react";
import { stringifyAST, parseStandardFormula } from "../utils/parserStandard";
import { decideLogicType, type LogicToken } from "../utils/tokenizer";
import {
  negateFormula,
  stringifyNegated,
  toNNF,
  replaceImplies,
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

  const results = useMemo(() => {
    try {
      const type = decideLogicType(tokens);
      if (type !== "standard") return null;

      const ast = parseStandardFormula(tokens);
      const negated = negateFormula(ast);
      const withoutImplies = replaceImplies(negated);
      const nnf = toNNF(withoutImplies);

      return {
        parsed: stringifyAST(ast),
        negated: stringifyNegated(negated),
        noImplies: stringifyAST(withoutImplies),
        nnf: stringifyAST(nnf),
      };
    } catch (e: any) {
      onError(e.message);
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
      </div>
    </div>
  );
};

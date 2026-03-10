// StepsToSetNotation.tsx - Zobrazenie krokov prevodu na množinovú notáciu
import { useEffect, useState } from 'react'
import { type ASTNode, stringifyAST, parseStandardFormula } from '../../utils/parserStandard'
import { decideLogicType, type LogicToken } from '../../utils/tokenizer'

interface StepsToSetNotationProps {
  tokens: LogicToken[];
  onError: (message: string) => void;
}

export const StepsToSetNotation = ({ tokens, onError }: StepsToSetNotationProps) => {
  const [ast, setAst] = useState<ASTNode | null>(null);

  useEffect(() => {
    try {
      const type = decideLogicType(tokens);
      if (type === 'standard') {
        const parsedAst = parseStandardFormula(tokens);
        setAst(parsedAst);
      } else {
        setAst(null);
      }
    } catch (e: any) {
      onError(e.message);
      setAst(null);
    }
  }, [tokens, onError]);

  if (!ast) return null;

  return (
    <div className="mt-6 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
        Kroky transformácie
      </h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-blue-600">Spracovaná formula (AST):</h3>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm border border-gray-200">
            {stringifyAST(ast)}
          </div>
        </div>
        
        {/* Tu budú neskôr ďalšie kroky: NNF, Skolemizácia, atď. */}
      </div>
    </div>
  );
};

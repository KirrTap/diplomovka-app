import { useState } from "react";
import "./index.css";
import { LanguageDropdown } from "./components/TopBar/LanguageDropdown.tsx";
import { Logo } from "./components/TopBar/Logo.tsx";
import { useLanguage } from "./translations/LanguageContext";
import { InputForm, type SearchStrategy } from "./components/InputBox/InputForm.tsx";
import { StepsToSetNotation } from "./components/StepsToSetNotation.tsx";
import { SLDResolutionView } from "./components/SLDResolutionView.tsx";
import { DocumentationModal } from "./components/DocumentationModal.tsx";
import { type LogicToken } from "./utils/tokenizer";

function Content() {
  const { t } = useLanguage();
  const [tokens, setTokens] = useState<LogicToken[] | null>(null);
  const [strategy, setStrategy] = useState<SearchStrategy>("dfs");
  const [error, setError] = useState<{
    key: string;
    params: Record<string, string>;
  } | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  const handleProcess = (newTokens: LogicToken[] | null) => {
    setTokens(newTokens);
  };

  const handleParserError = (errorMessage: string) => {
    if (errorMessage.includes("|")) {
      const [key, value] = errorMessage.split("|");
      setError({ key, params: { value } });
    } else {
      setError({
        key: errorMessage,
        params: { value: "" },
      });
    }
    setTokens(null);
  };

  return (
    <div className="min-h-screen p-6">
      {/* Horná časť aplikácie (hlavička, formulár, kroky) zostáva vycentrovaná na 80% */}
      <div className="w-[80%] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-1">
            <Logo />
            <h1 className="text-3xl font-semibold leading-none">
              {t("title")}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowDocs(true)}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors border-b-2 border-transparent hover:border-blue-600"
            >
              {t("documentation")}
            </button>
            <LanguageDropdown />
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <InputForm
            onProcess={handleProcess}
            externalError={error}
            setExternalError={setError}
          />
          {tokens && !error && (
            <StepsToSetNotation tokens={tokens} onError={handleParserError} />
          )}
        </div>
      </div>

      {/* Spodná časť (SLD strom a tabuľka). Rozdelenie do 60/40 je priamo v SLDResolutionView */}
      {tokens && !error && (
        <div className="mt-8 w-full pb-10">
          <SLDResolutionView 
            tokens={tokens} 
            strategy={strategy} 
            onStrategyChange={setStrategy} 
          />
        </div>
      )}

      <DocumentationModal isOpen={showDocs} onClose={() => setShowDocs(false)} />
    </div>
  );
}

export default Content;

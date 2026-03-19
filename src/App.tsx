import { useState } from "react";
import "./index.css";
import { LanguageDropdown } from "./components/TopBar/LanguageDropdown.tsx";
import { Logo } from "./components/TopBar/Logo.tsx";
import { useLanguage } from "./translations/LanguageContext";
import { InputForm, type SearchStrategy } from "./components/InputBox/InputForm.tsx";
import { StepsToSetNotation } from "./components/StepsToSetNotation.tsx";
import { SLDResolutionView } from "./components/SLDResolutionView.tsx";
import { type LogicToken } from "./utils/tokenizer";

function Content() {
  const { t } = useLanguage();
  const [tokens, setTokens] = useState<LogicToken[] | null>(null);
  const [strategy, setStrategy] = useState<SearchStrategy>("dfs");
  const [error, setError] = useState<{
    key: string;
    params: Record<string, string>;
  } | null>(null);

  const handleProcess = (newTokens: LogicToken[] | null, newStrategy: SearchStrategy) => {
    setTokens(newTokens);
    setStrategy(newStrategy);
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
      <div className="w-[80%] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-1">
            <Logo />
            <h1 className="text-3xl font-semibold leading-none">
              {t("title")}
            </h1>
          </div>
          <LanguageDropdown />
        </div>
        <div className="flex flex-col gap-8">
          <InputForm
            onProcess={handleProcess}
            externalError={error}
            setExternalError={setError}
          />
          {tokens && !error && (
            <>
              <StepsToSetNotation tokens={tokens} onError={handleParserError} />
              <SLDResolutionView tokens={tokens} strategy={strategy} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Content;

import { useRef, useState } from "react";
import { EXAMPLES } from "./examples";
import { useLanguage } from "../../translations/LanguageContext";
import { replaceShortcutsRealtime } from "../../utils/logicInputShortcuts";
import { logicTokenize, type LogicToken } from "../../utils/tokenizer";
import { ErrorMessage } from "./ErrorMessage";
import { SymbolButton } from "./SymbolButton";
import { SearchStrategySwitcher } from "./SearchStrategySwitcher";
import { ProcessButton } from "./ProcessButton";

export type SearchStrategy = "bfs" | "dfs";

interface InputFormProps {
  onProcess: (tokens: LogicToken[] | null, strategy: SearchStrategy) => void;
  externalError: { key: string; params: Record<string, string> } | null;
  setExternalError: (
    error: { key: string; params: Record<string, string> } | null,
  ) => void;
}

export const InputForm = ({
  onProcess,
  externalError,
  setExternalError,
}: InputFormProps) => {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [strategy, setStrategy] = useState<SearchStrategy>("dfs");
  const [showExamples, setShowExamples] = useState(false);
  const exampleBtnRef = useRef<HTMLButtonElement>(null);
  const handleExampleSelect = (exampleValue: string) => {
    setInputValue(exampleValue);
    setShowExamples(false);
    setExternalError(null);
    onProcess(null, strategy);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleInsertSymbol = (symbol: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue =
        inputValue.slice(0, start) + symbol + inputValue.slice(end);
      setInputValue(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + symbol.length,
          start + symbol.length,
        );
      }, 0);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(replaceShortcutsRealtime(e.target.value));
    setExternalError(null);
    onProcess(null, strategy);
  };

  const handleProcess = () => {
    const rawTokens = logicTokenize(inputValue);
    const unknownToken = rawTokens.find(
      (t): t is { type: "unknown"; value: string } => t.type === "unknown",
    );

    if (unknownToken) {
      setExternalError({
        key: "errors.error_unknown_character",
        params: {
          value: unknownToken.value,
        },
      });
      onProcess(null, strategy);
      return;
    }

    setExternalError(null);
    onProcess(rawTokens, strategy);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 py-4 px-8 flex flex-col">
      <label className="block text-lg font-semibold text-gray-700 mb-2">
        {t("enter_formula")}
      </label>
      <div className="mb-4">
        <div className="relative inline-block">
          <button
            ref={exampleBtnRef}
            type="button"
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 bg-white text-black font-medium hover:bg-gray-100 min-w-[120px]"
            style={{ minWidth: 120 }}
            onClick={() => setShowExamples((v) => !v)}
          >
            <span className="flex-1 text-left">{t("examples")}</span>
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showExamples && (
            <div
              className="absolute z-10 bg-white border border-gray-300 rounded shadow-lg mt-1 left-0 min-w-[140px]"
            >
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.labelKey}
                  className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-800"
                  onClick={() => handleExampleSelect(ex.value)}
                  type="button"
                >
                  {t(ex.labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleTextareaChange}
        spellCheck={false}
        className="w-full h-48 min-h-[192px] p-4 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 mb-4 text-lg"
      />
      {externalError && (
        <ErrorMessage
          message={t(externalError.key).replace(
            "{value}",
            externalError.params.value,
          )}
        />
      )}
      <div className="flex flex-wrap gap-4 items-end justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          <SymbolButton symbol="∧" onClick={handleInsertSymbol} />
          <SymbolButton symbol="∨" onClick={handleInsertSymbol} />
          <SymbolButton symbol="=>" onClick={handleInsertSymbol} />
          <SymbolButton symbol="¬" onClick={handleInsertSymbol} />
          <SymbolButton symbol="⊢" onClick={handleInsertSymbol} />
          <SymbolButton symbol="∀" onClick={handleInsertSymbol} />
          <SymbolButton symbol="∃" onClick={handleInsertSymbol} />
        </div>
        <div className="flex items-center gap-12 flex-wrap">
          <SearchStrategySwitcher
            strategy={strategy}
            setStrategy={setStrategy}
          />
          <ProcessButton onClick={handleProcess} />
        </div>
      </div>
    </div>
  );
};

import { useRef, useState } from 'react'
import { useLanguage } from '../../translations/LanguageContext'
import { replaceShortcutsRealtime } from '../../utils/logicInputShortcuts'
import { logicTokenize, type LogicToken } from '../../utils/tokenizer'
import { ErrorMessage } from './ErrorMessage'
import { SymbolButton } from './SymbolButton'
import { SearchStrategySwitcher } from './SearchStrategySwitcher'
import { ProcessButton } from './ProcessButton'

export type SearchStrategy = 'bfs' | 'dfs'

interface InputFormProps {
    onProcess: (tokens: LogicToken[] | null) => void;
    externalError: { key: string; params: Record<string, string> } | null;
    setExternalError: (error: { key: string; params: Record<string, string> } | null) => void;
}

export const InputForm = ({ onProcess, externalError, setExternalError }: InputFormProps) => {
  
    const { t } = useLanguage()
    const [inputValue, setInputValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [strategy, setStrategy] = useState<SearchStrategy>('bfs')


    const handleInsertSymbol = (symbol: string) => {
        if (textareaRef.current) {
            const textarea = textareaRef.current
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const newValue = inputValue.slice(0, start) + symbol + inputValue.slice(end)
            setInputValue(newValue)
            setTimeout(() => {
                textarea.focus()
                textarea.setSelectionRange(start + symbol.length, start + symbol.length)
            }, 0)
        }
    }

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(replaceShortcutsRealtime(e.target.value))
        setExternalError(null)
        onProcess(null)
    }

    const handleProcess = () => {
        const rawTokens = logicTokenize(inputValue)
        const unknownToken = rawTokens.find(
            (t): t is { type: 'unknown'; value: string } => t.type === 'unknown'
        );
        
        if (unknownToken) {
            setExternalError({
                key: 'errors.error_unknown_character',
                params: {
                    value: unknownToken.value
                }
            });
            onProcess(null)
            return;
        }

        setExternalError(null);
        onProcess(rawTokens);
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 py-4 px-8 flex flex-col">
            <label className="block text-lg font-semibold text-gray-700 mb-4">
                {t('enter_formula')}
            </label>
            <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                spellCheck={false}
                className="w-full h-32 min-h-36 p-4 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 mb-4 text-l"
            />
            {externalError && (
                <ErrorMessage 
                    message={
                    t(externalError.key)
                        .replace('{value}', externalError.params.value)
                    }
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
                    <SymbolButton symbol="(" onClick={handleInsertSymbol} />
                    <SymbolButton symbol=")" onClick={handleInsertSymbol} />
                </div>
                <div className="flex items-center gap-8 flex-wrap">
                    <SearchStrategySwitcher strategy={strategy} setStrategy={setStrategy} />
                    <ProcessButton onClick={handleProcess} />
                </div>
            </div>
        </div>
    )
}

import { useRef, useState } from 'react'
import { useLanguage } from '../translations/LanguageContext'
import { ProcessButton } from './ProcessButton'
import { SymbolButton } from './SymbolButton'
import { replaceShortcutsRealtime } from '../utils/logicInputShortcuts'
import { logicTokenize } from '../utils/tokenizer'
import { ErrorMessage } from './ErrorMessage'

export const InputForm = () => {
  
    const { t } = useLanguage()
    const [inputValue, setInputValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [error, setError] = useState<{ key: string; params: Record<string, string> } | null>(null);


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
        setError(null)
    }

    const handleProcess = () => {
        const tokens = logicTokenize(inputValue)
        const unknownToken = tokens.find(
            (t): t is { type: 'unknown'; value: string; position: number } => t.type === 'unknown'
        );
        if (unknownToken) {
            setError({
                key: 'errors.error_unknown_character',
                params: {
                    value: unknownToken.value,
                    position: String(unknownToken.position)
                }
            });
        } else {
            setError(null);
        }
    }

    return (
        <div className="mt-8">
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
                {error && (
                    <ErrorMessage 
                        message={
                        t(error.key)
                            .replace('{value}', error.params.value)
                            .replace('{position}', error.params.position)
                        }
                    />
                )}
                <div className="flex items-center justify-between mb-4">
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
                    <div>
                        <ProcessButton onClick={handleProcess} />
                    </div>
                </div>
            </div>
        </div>
    )
}

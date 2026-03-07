export const LOGIC_SYMBOL_REPLACEMENTS = [
    { shortcut: /\\and|\\land|\\&/g, symbol: '∧' },
    { shortcut: /\\lor|\\or|\\\|/g, symbol: '∨' },
    { shortcut: /\\implies|\\rightarrow|\\to/g, symbol: '=>' },
    { shortcut: /\\neg|\\not|\\!/g, symbol: '¬' },
    { shortcut: /\\vdash/g, symbol: '⊢' },
    { shortcut: /\\forall/g, symbol: '∀' },
    { shortcut: /\\exists/g, symbol: '∃' },
];

export function replaceShortcutsRealtime(str: string) {
    let out = str;
    for (const { shortcut, symbol } of LOGIC_SYMBOL_REPLACEMENTS) {
        out = out.replace(shortcut, symbol);
    }
    return out;
}

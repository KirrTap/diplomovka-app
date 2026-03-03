export const LOGIC_SYMBOL_REPLACEMENTS = [
    { shortcut: /\\rightarrow/g, symbol: '=>' },
    { shortcut: /\\implies/g, symbol: '=>' },
    { shortcut: /\\to/g, symbol: '=>' },
    { shortcut: /=>/g, symbol: '=>' },
    { shortcut: /\\leftarrow/g, symbol: '<=' },
    { shortcut: /\\and|\\wedge/g, symbol: '&&' },
    { shortcut: /\\or|\\vee/g, symbol: '||' },
    { shortcut: /\\not|\\neg|~/g, symbol: '!' },
    // ...pridaj ďalšie podľa potreby
];

export function replaceShortcutsRealtime(str: string) {
    let out = str;
    for (const { shortcut, symbol } of LOGIC_SYMBOL_REPLACEMENTS) {
        out = out.replace(shortcut, symbol);
    }
    return out;
}

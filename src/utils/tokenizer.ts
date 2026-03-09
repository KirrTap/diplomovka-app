//import { replaceShortcutsRealtime } from './logicInputShortcuts';

export type LogicToken =
  | { type: 'and' }
  | { type: 'or' }
  | { type: 'implies' }
  | { type: 'not' }
  | { type: '⊢' }
  | { type: 'forall' }
  | { type: 'exists' }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'comma' }
  | { type: 'minus' }
  | { type: 'identifier'; value: string }
  | { type: 'unknown'; value: string }
  | { type: 'query' }
  | { type: 'rule' }
  | { type: 'fact' }
  | { type: 'eof' };

export function logicTokenize(rawInput: string): LogicToken[] {
  const input = rawInput;
  const tokens: LogicToken[] = [];
  let i = 0;

  while (i < input.length) {
    const c = input[i];
    // Skip whitespace
    if (c.match(/\s/)) {
      i++;
      continue;
    }
    // Single-char tokens
    switch (c) {
      case '∧': tokens.push({ type: 'and' }); i++; continue;
      case '∨': tokens.push({ type: 'or' }); i++; continue;
      case '¬': tokens.push({ type: 'not' }); i++; continue;
      case '⊢': tokens.push({ type: '⊢' }); i++; continue;
      case '∀': tokens.push({ type: 'forall' }); i++; continue;
      case '∃': tokens.push({ type: 'exists' }); i++; continue;
      case '(': tokens.push({ type: 'lparen' }); i++; continue;
      case ')': tokens.push({ type: 'rparen' }); i++; continue;
      case ',': tokens.push({ type: 'comma' }); i++; continue;
      case '-': tokens.push({ type: 'minus' }); i++; continue;
      case '?': tokens.push({ type: 'query' }); i++; continue;
      case '.': tokens.push({ type: 'fact' }); i++; continue;
    }
    // Multi-char tokens
    // =>
    if (c === '=' && input[i+1] === '>') {
      tokens.push({ type: 'implies' });
      i += 2;
      continue;
    }
    // :- for rules
    if (c === ':' && input[i+1] === '-') {
      tokens.push({ type: 'rule' });
      i += 2;
      continue;
    }
    // identifier (letter or digit starts)
    if (c.match(/[a-zA-Z_]/)) {
      let start = i;
      while (i < input.length && input[i].match(/[a-zA-Z0-9_]/)) i++;
      tokens.push({ type: 'identifier', value: input.slice(start, i) });
      continue;
    }
    // unknown
    tokens.push({ type: 'unknown', value: c });
    i++;
  }
  tokens.push({ type: 'eof' });
  return tokens;
}
  export function decideLogicType(tokens: LogicToken[]): 'sekvent' | 'prolog' | 'standard' {
    let hasSequent = false;
    let hasProlog = false;
    for (const token of tokens) {
      if (token.type === '⊢') {
        hasSequent = true;
      }
      if (token.type === 'query' || token.type === 'rule' || token.type === 'fact') {
        hasProlog = true;
      }
    }
    if (hasSequent) return 'sekvent';
    if (hasProlog) return 'prolog';
    return 'standard';
  }

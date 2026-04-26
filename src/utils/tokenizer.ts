export type LogicToken =
  | { type: "and" }
  | { type: "or" }
  | { type: "implies" }
  | { type: "not" }
  | { type: "forall" }
  | { type: "exists" }
  | { type: "lparen" }
  | { type: "rparen" }
  | { type: "comma" }
  | { type: "lower_id"; value: string }
  | { type: "upper_id"; value: string }
  | { type: "number"; value: string }
  | { type: "unknown"; value: string }
  | { type: "query" }
  | { type: "rule" }
  | { type: "fact" }
  | { type: "eof" };

export function logicTokenize(rawInput: string): LogicToken[] {
  const input = rawInput;
  const tokens: LogicToken[] = [];
  let i = 0;

  while (i < input.length) {
    const c = input[i];
    if (c.match(/\s/)) {
      i++;
      continue;
    }
    switch (c) {
      case "∧":
        tokens.push({ type: "and" });
        i++;
        continue;
      case "∨":
        tokens.push({ type: "or" });
        i++;
        continue;
      case "¬":
        tokens.push({ type: "not" });
        i++;
        continue;
      case "∀":
        tokens.push({ type: "forall" });
        i++;
        continue;
      case "∃":
        tokens.push({ type: "exists" });
        i++;
        continue;
      case "(":
        tokens.push({ type: "lparen" });
        i++;
        continue;
      case ")":
        tokens.push({ type: "rparen" });
        i++;
        continue;
      case ",":
        tokens.push({ type: "comma" });
        i++;
        continue;
      case ".":
        tokens.push({ type: "fact" });
        i++;
        continue;
    }

    if (c === "?" && input[i + 1] === "-") {
      tokens.push({ type: "query" });
      i += 2;
      continue;
    }

    if (c === "=" && input[i + 1] === ">") {
      tokens.push({ type: "implies" });
      i += 2;
      continue;
    }

    if (c === ":" && input[i + 1] === "-") {
      tokens.push({ type: "rule" });
      i += 2;
      continue;
    }
    if (c.match(/[0-9]/)) {
      const start = i;
      while (i < input.length && input[i].match(/[0-9]/)) {
        i++;
      }
      const value = input.slice(start, i);
      tokens.push({ type: "number", value });
      continue;
    }
    if (c.match(/[a-zA-Z_]/)) {
      const start = i;
      while (i < input.length && input[i].match(/[a-zA-Z0-9_]/)) {
        i++;
      }
      const value = input.slice(start, i);
      if (value[0].match(/[A-Z]/)) {
        tokens.push({ type: "upper_id", value });
      } else {
        tokens.push({ type: "lower_id", value });
      }
      continue;
    }

    tokens.push({ type: "unknown", value: c });
    i++;
  }
  tokens.push({ type: "eof" });
  return tokens;
}
export function decideLogicType(
  tokens: LogicToken[],
): "prolog" | "standard" {
  let hasProlog = false;
  for (const token of tokens) {
    if (
      token.type === "query" ||
      token.type === "rule" ||
      token.type === "fact"
    ) {
      hasProlog = true;
    }
  }
  if (hasProlog) return "prolog";
  return "standard";
}

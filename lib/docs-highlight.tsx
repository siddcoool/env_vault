import React from "react";

type TokenKind =
  | "comment"
  | "string"
  | "keyword"
  | "number"
  | "function"
  | "plain";

const JS_KEYWORDS = new Set([
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "null",
  "of",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "type",
  "interface",
  "enum",
  "as",
  "satisfies",
  "keyof",
  "readonly",
]);

const TOKEN_CLASS: Record<TokenKind, string> = {
  comment: "text-slate-500",
  string: "text-emerald-400",
  keyword: "text-violet-400",
  number: "text-amber-400",
  function: "text-sky-400",
  plain: "text-foreground",
};

function span(kind: TokenKind, text: string, key: number) {
  return (
    <span key={key} className={TOKEN_CLASS[kind]}>
      {text}
    </span>
  );
}

function highlightJsLike(code: string): React.ReactNode[] {
  const pattern =
    /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+\.?\d*\b|\b[A-Za-z_$][\w$]*\b|[^\s])/g;

  const nodes: React.ReactNode[] = [];
  let key = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(code.slice(lastIndex, match.index));
    }

    const token = match[0];
    let kind: TokenKind = "plain";

    if (
      token.startsWith("//") ||
      token.startsWith("/*") ||
      token.startsWith("#")
    ) {
      kind = "comment";
    } else if (
      token.startsWith('"') ||
      token.startsWith("'") ||
      token.startsWith("`")
    ) {
      kind = "string";
    } else if (/^\d/.test(token)) {
      kind = "number";
    } else if (JS_KEYWORDS.has(token)) {
      kind = "keyword";
    } else if (/^[A-Za-z_$]/.test(token)) {
      const next = code.slice(match.index + token.length).match(/^\s*\(/);
      kind = next ? "function" : "plain";
    }

    nodes.push(span(kind, token, key++));
    lastIndex = match.index + token.length;
  }

  if (lastIndex < code.length) {
    nodes.push(code.slice(lastIndex));
  }

  return nodes;
}

function highlightJson(code: string): React.ReactNode[] {
  const pattern =
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|\b-?\d+\.?\d*\b|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;

  const nodes: React.ReactNode[] = [];
  let key = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={key++} className="text-foreground">
          {code.slice(lastIndex, match.index)}
        </span>,
      );
    }

    const [full, stringToken, colon] = match;
    if (stringToken) {
      nodes.push(
        span(colon ? "keyword" : "string", stringToken, key++),
      );
      if (colon) {
        nodes.push(
          <span key={key++} className="text-foreground">
            {colon}
          </span>,
        );
      }
    } else if (full.startsWith("//") || full.startsWith("/*")) {
      nodes.push(span("comment", full, key++));
    } else if (/^-?\d/.test(full)) {
      nodes.push(span("number", full, key++));
    } else {
      nodes.push(span("keyword", full, key++));
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < code.length) {
    nodes.push(code.slice(lastIndex));
  }

  return nodes;
}

function highlightEnv(code: string): React.ReactNode[] {
  return code.split("\n").map((line, index, arr) => {
    const ending = index < arr.length - 1 ? "\n" : "";

    if (line.trim().startsWith("#")) {
      return (
        <React.Fragment key={index}>
          {span("comment", line, index)}
          {ending}
        </React.Fragment>
      );
    }

    const eq = line.indexOf("=");
    if (eq === -1) {
      return (
        <React.Fragment key={index}>
          {line}
          {ending}
        </React.Fragment>
      );
    }

    return (
      <React.Fragment key={index}>
        <span className="font-medium text-violet-400">{line.slice(0, eq)}</span>
        <span className="text-slate-500">=</span>
        <span className="text-emerald-400">{line.slice(eq + 1)}</span>
        {ending}
      </React.Fragment>
    );
  });
}

function highlightBash(code: string): React.ReactNode[] {
  const pattern =
    /(#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:npm|node|git|cd|curl|export|npx|pnpm|yarn|bun)\b|\B-{1,2}[\w-]+|\b\d+\b)/g;

  const nodes: React.ReactNode[] = [];
  let key = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(code.slice(lastIndex, match.index));
    }

    const token = match[0];
    let kind: TokenKind = "plain";

    if (token.startsWith("#")) kind = "comment";
    else if (token.startsWith('"') || token.startsWith("'")) kind = "string";
    else if (/^\d+$/.test(token)) kind = "number";
    else if (token.startsWith("-")) kind = "keyword";
    else kind = "function";

    nodes.push(span(kind, token, key++));
    lastIndex = match.index + token.length;
  }

  if (lastIndex < code.length) {
    nodes.push(code.slice(lastIndex));
  }

  return nodes;
}

export type DocsCodeLanguage = "javascript" | "typescript" | "json" | "bash" | "env";

export function highlightDocsCode(
  code: string,
  language: DocsCodeLanguage,
): React.ReactNode[] {
  switch (language) {
    case "json":
      return highlightJson(code);
    case "env":
      return highlightEnv(code);
    case "bash":
      return highlightBash(code);
    case "javascript":
    case "typescript":
    default:
      return highlightJsLike(code);
  }
}

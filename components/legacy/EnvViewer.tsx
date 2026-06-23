import React from "react";

interface EnvViewerProps {
  value: string;
}

function renderLine(line: string, index: number) {
  if (line.trim().startsWith("#")) {
    return (
      <span key={index} className="text-slate-400 dark:text-slate-500">
        {line}
      </span>
    );
  }

  const eqIndex = line.indexOf("=");
  if (eqIndex === -1) {
    return <span key={index}>{line}</span>;
  }

  const envKey = line.slice(0, eqIndex);
  const envValue = line.slice(eqIndex + 1);

  return (
    <span key={index}>
      <span className="font-medium text-purple-500 dark:text-purple-400">{envKey}</span>
      <span className="text-slate-500 dark:text-slate-400">=</span>
      <span className="text-emerald-600 dark:text-emerald-400">{envValue}</span>
    </span>
  );
}

export function EnvViewer({ value }: EnvViewerProps) {
  const lines = value.split("\n");

  return (
    <pre className="absolute inset-0 overflow-auto p-6 font-mono text-sm bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {renderLine(line, i)}
          {i < lines.length - 1 && "\n"}
        </React.Fragment>
      ))}
    </pre>
  );
}

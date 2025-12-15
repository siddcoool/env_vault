import React from "react";

interface EnvEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const EnvEditor: React.FC<EnvEditorProps> = ({ value, onChange }) => {
  const renderLine = (line: string, index: number) => {
    // Comments
    if (line.trim().startsWith("#")) {
      return (
        <span key={index} className="text-slate-400 dark:text-slate-500">
          {line}
        </span>
      );
    }

    const equalIndex = line.indexOf("=");

    if (equalIndex === -1) {
      return <span key={index}>{line}</span>;
    }

    const key = line.slice(0, equalIndex);
    const valuePart = line.slice(equalIndex + 1);

    return (
      <span key={index}>
        <span className="text-purple-500 dark:text-purple-400 font-medium">{key}</span>
        <span className="text-slate-500 dark:text-slate-400">=</span>
        <span className="text-emerald-600 dark:text-emerald-400">{valuePart}</span>
      </span>
    );
  };

  const highlighted = value.split("\n").map((line, i, arr) => (
    <React.Fragment key={i}>
      {renderLine(line, i)}
      {i < arr.length - 1 && "\n"}
    </React.Fragment>
  ));

  return (
    <div className="absolute inset-0">
      <pre
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full p-6 font-mono text-sm bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed custom-scrollbar"
      >
        {highlighted}
      </pre>
      <textarea
        className="absolute inset-0 w-full h-full p-6 font-mono text-sm bg-transparent text-transparent caret-primary-500 dark:caret-primary-400 resize-none focus:outline-none custom-scrollbar leading-relaxed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
};



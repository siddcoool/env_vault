"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  FileCode,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { type LegacyProject, type LegacyEnvFile } from "@/lib/legacy-auth";
import { Button } from "@/components/ui/button";
import { EnvViewer } from "@/components/legacy/EnvViewer";
import { objectToJsExport, parseEnvToObject } from "@/lib/env-object-utils";

interface LegacyProjectDetailProps {
  project: LegacyProject;
  onBack: () => void;
}

type EditorView = "env" | "js";

export function LegacyProjectDetail({ project, onBack }: LegacyProjectDetailProps) {
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [editorView, setEditorView] = useState<EditorView>("env");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const selectedEnv: LegacyEnvFile | undefined = project.envFiles.find(
    (e) => e.id === selectedEnvId,
  );

  const handleCopy = () => {
    if (!selectedEnv) return;
    const text =
      editorView === "js"
        ? objectToJsExport(parseEnvToObject(selectedEnv.content))
        : selectedEnv.content;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!selectedEnv?.fileLink) return;
    void navigator.clipboard.writeText(selectedEnv.fileLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const jsPreview = selectedEnv
    ? objectToJsExport(parseEnvToObject(selectedEnv.content))
    : "";

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-4">
            <ArrowLeft className="size-5" />
          </Button>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            {project.name}
          </h2>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* File list sidebar */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-950">
          <div className="space-y-1 p-3">
            {project.envFiles.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No environment files.
                </p>
              </div>
            )}
            {project.envFiles.map((env) => (
              <button
                key={env.id}
                onClick={() => {
                  setSelectedEnvId(env.id);
                  setEditorView("env");
                }}
                className={`group flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  selectedEnvId === env.id
                    ? "border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 text-primary"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800/50"
                }`}
              >
                <FileCode
                  className={`mr-2 size-4 ${
                    selectedEnvId === env.id ? "text-primary" : "text-gray-400"
                  }`}
                />
                <span className="truncate">{env.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-slate-900">
          {selectedEnv ? (
            <>
              <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex overflow-hidden rounded-md border">
                    <button
                      type="button"
                      onClick={() => setEditorView("env")}
                      className={`px-3 py-1 text-xs ${
                        editorView === "env"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      .env
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorView("js")}
                      className={`px-3 py-1 text-xs ${
                        editorView === "js"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      JS object
                    </button>
                  </div>

                  {selectedEnv.fileLink && (
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 font-mono text-xs hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                      title="Copy file link for API"
                    >
                      <Link2 className="size-3" />
                      {selectedEnv.fileLink}
                      {linkCopied ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Copy className="size-3 opacity-50" />
                      )}
                    </button>
                  )}

                  {editorView === "env" && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">
                      {selectedEnv.content.split("\n").length} lines
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="size-4 text-green-500" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>

              <div className="relative flex-1">
                {editorView === "env" ? (
                  <EnvViewer value={selectedEnv.content} />
                ) : (
                  <pre className="absolute inset-0 overflow-auto whitespace-pre-wrap p-6 font-mono text-sm text-gray-800 bg-white dark:bg-slate-950 dark:text-gray-300">
                    {jsPreview}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <FileCode className="mb-4 size-16 opacity-20" />
              <p className="text-lg font-medium">Select a file to view</p>
              <p className="mt-2 text-sm">Choose an environment file from the list.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

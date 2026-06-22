"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Save,
  Plus,
  FileCode,
  Trash2,
  Copy,
  Check,
  Info,
  Link2,
} from "lucide-react";
import { Project } from "../types";
import { Button } from "./ui/button";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/input";
import { EnvEditor } from "./EnvEditor";
import {
  objectToJsExport,
  parseEnvToObject,
} from "@/lib/env-object-utils";

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onAddEnv: (projectId: string, name: string) => void;
  onUpdateEnv: (projectId: string, envId: string, content: string) => void;
  onDeleteEnv: (projectId: string, envId: string) => void;
}

type EditorView = "env" | "js";

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  onBack,
  onAddEnv,
  onUpdateEnv,
  onDeleteEnv,
}) => {
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorView, setEditorView] = useState<EditorView>("env");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleSelectEnv = (envId: string, content: string) => {
    setSelectedEnvId(envId);
    setEditorContent(content);
    setEditorView("env");
    setIsDirty(false);
  };

  const handleSave = () => {
    if (selectedEnvId) {
      onUpdateEnv(project.id, selectedEnvId, editorContent);
      setIsDirty(false);
    }
  };

  const handleCreateEnv = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEnvName.trim()) {
      onAddEnv(project.id, newEnvName);
      setNewEnvName("");
      setIsModalOpen(false);
    }
  };

  const handleDelete = (envId: string) => {
    if (confirm("Are you sure you want to delete this environment file?")) {
      onDeleteEnv(project.id, envId);
      if (selectedEnvId === envId) {
        setSelectedEnvId(null);
        setEditorContent("");
      }
    }
  };

  const handleCopy = () => {
    const text =
      editorView === "js"
        ? objectToJsExport(parseEnvToObject(editorContent))
        : editorContent;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!selectedEnv?.fileLink) return;
    navigator.clipboard.writeText(selectedEnv.fileLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const selectedEnv = project.envFiles.find((e) => e.id === selectedEnvId);
  const jsPreview = objectToJsExport(parseEnvToObject(editorContent));

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {project.name}
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New File
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar flex-shrink-0">
          <div className="p-3 space-y-1">
            {project.envFiles.length === 0 && (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">No environment files yet.</p>
              </div>
            )}
            {project.envFiles.map((env) => (
              <div
                key={env.id}
                onClick={() => handleSelectEnv(env.id, env.content)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                  selectedEnvId === env.id
                    ? "bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-200 dark:border-slate-700"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center truncate">
                  <FileCode
                    className={`w-4 h-4 mr-2 ${
                      selectedEnvId === env.id ? "text-primary-500" : "text-gray-400"
                    }`}
                  />
                  <span className="truncate">{env.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(env.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0">
          {selectedEnv ? (
            <>
              <div className="h-12 flex items-center justify-between px-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex rounded-md border overflow-hidden">
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
                      className="flex items-center gap-1 rounded bg-gray-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs hover:bg-gray-200 dark:hover:bg-slate-700"
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
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800">
                      {editorContent.split("\n").length} lines
                    </span>
                  )}
                  {isDirty && editorView === "env" && (
                    <span className="text-amber-500 text-xs font-medium">● Unsaved Changes</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy to clipboard">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  {editorView === "env" && (
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!isDirty}
                      className={isDirty ? "animate-pulse" : ""}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1 relative">
                {editorView === "env" ? (
                  <EnvEditor
                    value={editorContent}
                    onChange={(val) => {
                      setEditorContent(val);
                      setIsDirty(true);
                    }}
                  />
                ) : (
                  <pre className="absolute inset-0 overflow-auto p-6 font-mono text-sm bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                    {jsPreview}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <FileCode className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a file to edit</p>
              <p className="text-sm mt-2">Or create a new environment file to get started.</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Environment File"
      >
        <form onSubmit={handleCreateEnv} className="space-y-4">
          <div className="w-full">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Filename
            </label>
            <Input
              placeholder="e.g., .env.production"
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
            <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <p>
              Enter values in .env format. They are stored as a JS object and exposed via a unique file link.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button type="submit">Create File</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

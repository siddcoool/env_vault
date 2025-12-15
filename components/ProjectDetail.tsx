"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, FileCode, Trash2, Copy, Check, Info } from "lucide-react";
import { Project } from "../types";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onAddEnv: (projectId: string, name: string) => void;
  onUpdateEnv: (projectId: string, envId: string, content: string) => void;
  onDeleteEnv: (projectId: string, envId: string) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  onBack,
  onAddEnv,
  onUpdateEnv,
  onDeleteEnv,
}) => {
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(
    project.envFiles.length > 0 ? project.envFiles[0].id : null,
  );
  const [editorContent, setEditorContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedEnvId) {
      const env = project.envFiles.find((e) => e.id === selectedEnvId);
      if (env) {
        setEditorContent(env.content);
        setIsDirty(false);
      }
    } else if (project.envFiles.length > 0) {
      setSelectedEnvId(project.envFiles[0].id);
    }
  }, [selectedEnvId, project.envFiles]);

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
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedEnv = project.envFiles.find((e) => e.id === selectedEnvId);

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
                onClick={() => setSelectedEnvId(env.id)}
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
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800">
                    {editorContent.split("\n").length} lines
                  </span>
                  {isDirty && (
                    <span className="text-amber-500 text-xs font-medium">● Unsaved Changes</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy to clipboard">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={isDirty ? "animate-pulse" : ""}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
              <div className="flex-1 relative">
                <textarea
                  className="absolute inset-0 w-full h-full p-6 font-mono text-sm bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-300 resize-none focus:outline-none custom-scrollbar leading-relaxed"
                  value={editorContent}
                  onChange={(e) => {
                    setEditorContent(e.target.value);
                    setIsDirty(true);
                  }}
                  spellCheck={false}
                />
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
          <Input
            label="Filename"
            placeholder="e.g., .env.production"
            value={newEnvName}
            onChange={(e) => setNewEnvName(e.target.value)}
            autoFocus
            required
          />
          <div className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
            <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <p>
              Typically environment files start with <code>.env</code>. We&apos;ll automatically add the
              extension if you miss it.
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



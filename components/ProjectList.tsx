"use client";

import React, { useState } from "react";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import { Project } from "../types";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onAddProject: (name: string, description: string) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onSelectProject,
  onAddProject,
  onDeleteProject,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName, newProjectDesc);
      setNewProjectName("");
      setNewProjectDesc("");
      setIsModalOpen(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage your project environments securely.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-800">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No projects yet</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400 mb-6">
              Create your first project to get started.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary-500 dark:hover:border-primary-500"
                onClick={() => onSelectProject(project)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Are you sure you want to delete this project?"))
                        onDeleteProject(project.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 h-10">
                  {project.description || "No description provided."}
                </p>
                <div className="flex items-center text-xs text-gray-400 font-mono">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded">
                    {project.envFiles.length} ENV FILES
                  </span>
                  <span className="mx-2">•</span>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Project Name"
              placeholder="e.g., My Awesome App"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              autoFocus
              required
            />
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Briefly describe your project..."
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
              />
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
              <Button type="submit">Create Project</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};



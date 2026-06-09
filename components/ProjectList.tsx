"use client";

import React, { useState, useMemo } from "react";
import { Plus, FolderOpen, Trash2, FileCode, Search } from "lucide-react";
import { Project } from "../types";
import { Button } from "./ui/button";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { formatRelativeTime, getProjectUpdatedAt } from "@/lib/project-utils";

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
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    );
  }, [projects, search]);

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
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header row */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your project environments securely.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
          <FolderOpen className="mb-3 size-10 text-muted-foreground" />
          <h3 className="font-medium">No projects yet</h3>
          <p className="mt-1 text-sm text-muted-foreground mb-5">
            Create your first project to get started.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[240px] pl-4">Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[110px]">Env Files</TableHead>
                <TableHead className="w-[150px]">Last Updated</TableHead>
                <TableHead className="w-[52px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No projects match &ldquo;{search}&rdquo;
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer group"
                    onClick={() => onSelectProject(project)}
                  >
                    <TableCell className="pl-4 font-medium">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                        {project.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {project.description || (
                        <span className="opacity-40">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileCode className="size-3.5" />
                        <span className="tabular-nums">{project.envFiles.length}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatRelativeTime(getProjectUpdatedAt(project))}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this project?"))
                            onDeleteProject(project.id);
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Project Name</label>
            <Input
              placeholder="e.g., My Awesome App"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
              rows={3}
              placeholder="Briefly describe your project..."
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

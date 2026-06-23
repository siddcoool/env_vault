"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, FileCode, FolderOpen, Search } from "lucide-react";
import { type LegacyProject } from "@/lib/legacy-auth";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LegacyProjectListProps {
  projects: LegacyProject[];
  onSelectProject: (project: LegacyProject) => void;
}

export function LegacyProjectList({ projects, onSelectProject }: LegacyProjectListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query),
    );
  }, [projects, search]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Legacy Projects</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Read-only view of projects from the previous system.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="flex gap-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            These projects use the old passcode model and are{" "}
            <strong>read-only</strong>. Run the migration script to move them
            to a workspace account with full features.
          </p>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
          <FolderOpen className="mb-3 size-10 text-muted-foreground" />
          <h3 className="font-medium">No legacy projects found</h3>
          <p className="mb-5 mt-1 text-sm text-muted-foreground">
            All projects have been migrated or none exist in the old format.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[240px] pl-4">Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[110px]">Env Files</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                    No projects match &ldquo;{search}&rdquo;
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer"
                    onClick={() => onSelectProject(project)}
                  >
                    <TableCell className="pl-4 font-medium">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                        {project.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {project.description || <span className="opacity-40">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileCode className="size-3.5" />
                        <span className="tabular-nums">{project.envFiles.length}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

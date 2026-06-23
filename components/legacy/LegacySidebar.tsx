"use client";

import { Database, FolderOpen, LayoutDashboard } from "lucide-react";
import { type LegacyProject } from "@/lib/legacy-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface LegacySidebarProps {
  projects: LegacyProject[];
  selectedProjectId: string | null;
  isHome: boolean;
  onNavigateHome: () => void;
  onSelectProject: (project: LegacyProject) => void;
}

export function LegacySidebar({
  projects,
  selectedProjectId,
  isHome,
  onNavigateHome,
  onSelectProject,
}: LegacySidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <Database className="size-5 text-sidebar-primary" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">EnvVault</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Legacy
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isHome}
                  onClick={onNavigateHome}
                  tooltip="Projects"
                >
                  <LayoutDashboard />
                  <span>Projects</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            {projects.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                No legacy projects
              </p>
            ) : (
              <SidebarMenu className="gap-1">
                {projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      isActive={selectedProjectId === project.id}
                      onClick={() => onSelectProject(project)}
                      tooltip={project.name}
                      className="!h-auto min-h-9 items-start py-1.5"
                    >
                      <FolderOpen className="mt-0.5 shrink-0" />
                      <span className="truncate text-sm leading-tight">
                        {project.name}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <p className="px-2 text-xs text-muted-foreground">
          {projects.length} project{projects.length !== 1 ? "s" : ""} · read-only
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

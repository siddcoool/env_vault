"use client";

import { Database, FolderOpen, Key, LayoutDashboard } from "lucide-react";
import { Project } from "@/types";
import {
  formatRelativeTime,
  getProjectUpdatedAt,
  getRecentlyUpdatedProjects,
} from "@/lib/project-utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  isHome: boolean;
  isApiKeys: boolean;
  onNavigateHome: () => void;
  onNavigateApiKeys: () => void;
  onSelectProject: (project: Project) => void;
}

export function AppSidebar({
  projects,
  selectedProjectId,
  isHome,
  isApiKeys,
  onNavigateHome,
  onNavigateApiKeys,
  onSelectProject,
}: AppSidebarProps) {
  const recentProjects = getRecentlyUpdatedProjects(projects);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <Database className="size-5 text-sidebar-primary" />
          <span className="text-lg font-semibold">EnvVault</span>
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isApiKeys}
                  onClick={onNavigateApiKeys}
                  tooltip="API Keys"
                >
                  <Key />
                  <span>API Keys</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Recently Updated</SidebarGroupLabel>
          <SidebarGroupContent>
            {recentProjects.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                No projects yet
              </p>
            ) : (
              <SidebarMenu className="gap-1">
                {recentProjects.map((project) => {
                  const updatedAt = getProjectUpdatedAt(project);
                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        isActive={selectedProjectId === project.id}
                        onClick={() => onSelectProject(project)}
                        tooltip={project.name}
                        className="!h-auto min-h-10 items-start py-2"
                      >
                        <FolderOpen className="mt-0.5 shrink-0" />
                        <div className="grid min-w-0 flex-1 gap-1">
                          <span className="truncate text-sm leading-tight">
                            {project.name}
                          </span>
                          <span className="text-xs leading-tight text-muted-foreground">
                            {formatRelativeTime(updatedAt)}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

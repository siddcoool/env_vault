"use client";

import React from "react";
import { LogOut, Moon, Sun } from "lucide-react";
import { logoutAction } from "@/app/authActions";
import { Project } from "@/types";
import { AppSidebar } from "@/components/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";

interface LayoutProps {
  children: React.ReactNode;
  projects: Project[];
  selectedProjectId: string | null;
  onNavigateHome: () => void;
  onNavigateSettings: () => void;
  onNavigateDocs: () => void;
  onSelectProject: (project: Project) => void;
  isHome: boolean;
  isSettings: boolean;
  isDocs: boolean;
  currentProjectName?: string;
  workspaceName?: string;
  userEmail?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  projects,
  selectedProjectId,
  onNavigateHome,
  onNavigateSettings,
  onNavigateDocs,
  onSelectProject,
  isHome,
  isSettings,
  isDocs,
  currentProjectName,
  workspaceName,
  userEmail,
}) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <SidebarProvider>
      <AppSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        isHome={isHome}
        isSettings={isSettings}
        isDocs={isDocs}
        onNavigateHome={onNavigateHome}
        onNavigateSettings={onNavigateSettings}
        onNavigateDocs={onNavigateDocs}
        onSelectProject={onSelectProject}
        workspaceName={workspaceName}
        userEmail={userEmail}
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <nav className="flex flex-1 items-center gap-1 text-sm text-muted-foreground">
            <button
              onClick={onNavigateHome}
              className="hover:text-foreground transition-colors"
            >
              Projects
            </button>
            {isDocs && (
              <>
                <span className="mx-1 opacity-40">/</span>
                <span className="text-foreground font-medium">Docs</span>
              </>
            )}
            {isSettings && (
              <>
                <span className="mx-1 opacity-40">/</span>
                <span className="text-foreground font-medium">Settings</span>
              </>
            )}
            {!isHome && !isSettings && !isDocs && currentProjectName && (
              <>
                <span className="mx-1 opacity-40">/</span>
                <span className="text-foreground font-medium">{currentProjectName}</span>
              </>
            )}
          </nav>
          <div className="flex items-center gap-1">
            {userEmail && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => void logoutAction()}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

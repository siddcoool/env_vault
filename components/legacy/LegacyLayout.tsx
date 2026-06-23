"use client";

import React from "react";
import { LogOut, Moon, Sun } from "lucide-react";
import { legacyLogoutAction } from "@/app/authActions";
import { type LegacyProject } from "@/lib/legacy-auth";
import { LegacySidebar } from "@/components/legacy/LegacySidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";

interface LegacyLayoutProps {
  children: React.ReactNode;
  projects: LegacyProject[];
  selectedProjectId: string | null;
  onNavigateHome: () => void;
  onSelectProject: (project: LegacyProject) => void;
  isHome: boolean;
  currentProjectName?: string;
}

export function LegacyLayout({
  children,
  projects,
  selectedProjectId,
  onNavigateHome,
  onSelectProject,
  isHome,
  currentProjectName,
}: LegacyLayoutProps) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <SidebarProvider>
      <LegacySidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        isHome={isHome}
        onNavigateHome={onNavigateHome}
        onSelectProject={onSelectProject}
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <nav className="flex flex-1 items-center gap-1 text-sm text-muted-foreground">
            <button
              onClick={onNavigateHome}
              className="transition-colors hover:text-foreground"
            >
              Projects
            </button>
            {!isHome && currentProjectName && (
              <>
                <span className="mx-1 opacity-40">/</span>
                <span className="font-medium text-foreground">{currentProjectName}</span>
              </>
            )}
          </nav>
          <div className="flex items-center gap-1">
            <form action={legacyLogoutAction}>
              <Button type="submit" variant="ghost" size="sm" className="gap-1.5">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
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
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

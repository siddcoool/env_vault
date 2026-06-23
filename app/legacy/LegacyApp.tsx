"use client";

import React, { useState } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { LegacyLayout } from "@/components/legacy/LegacyLayout";
import { LegacyProjectList } from "@/components/legacy/LegacyProjectList";
import { LegacyProjectDetail } from "@/components/legacy/LegacyProjectDetail";
import { type LegacyProject } from "@/lib/legacy-auth";

interface LegacyAppProps {
  initialProjects: LegacyProject[];
}

export function LegacyApp({ initialProjects }: LegacyAppProps) {
  const [selectedProject, setSelectedProject] = useState<LegacyProject | null>(null);

  const handleSelectProject = (project: LegacyProject) => {
    setSelectedProject(project);
  };

  const handleNavigateHome = () => {
    setSelectedProject(null);
  };

  return (
    <ThemeProvider>
      <LegacyLayout
        projects={initialProjects}
        selectedProjectId={selectedProject?.id ?? null}
        onSelectProject={handleSelectProject}
        onNavigateHome={handleNavigateHome}
        isHome={selectedProject === null}
        currentProjectName={selectedProject?.name}
      >
        {selectedProject === null ? (
          <LegacyProjectList
            projects={initialProjects}
            onSelectProject={handleSelectProject}
          />
        ) : (
          <LegacyProjectDetail
            project={selectedProject}
            onBack={handleNavigateHome}
          />
        )}
      </LegacyLayout>
    </ThemeProvider>
  );
}

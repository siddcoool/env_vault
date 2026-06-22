"use client";

import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { ProjectList } from "../components/ProjectList";
import { ProjectDetail } from "../components/ProjectDetail";
import { Project, ViewState, ApiKey, WorkspaceInfo } from "../types";
import { ThemeProvider } from "../context/ThemeContext";
import {
  createProjectAction,
  deleteProjectAction,
  createEnvFileAction,
  updateEnvFileAction,
  deleteEnvFileAction,
} from "./actions";
import { ApiKeysPanel } from "../components/ApiKeysPanel";
import { SettingsPanel } from "../components/SettingsPanel";

interface EnvVaultAppProps {
  initialProjects: Project[];
  initialApiKeys: ApiKey[];
  workspace: WorkspaceInfo | null;
  userEmail: string;
}

export const EnvVaultApp: React.FC<EnvVaultAppProps> = ({
  initialProjects,
  initialApiKeys,
  workspace,
  userEmail,
}) => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    setApiKeys(initialApiKeys);
  }, [initialApiKeys]);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setView(ViewState.PROJECT_DETAIL);
  };

  const handleCreateProject = (name: string, description: string) => {
    const data = new FormData();
    data.append("name", name);
    data.append("description", description);
    void createProjectAction(data);
  };

  const handleDeleteProject = (id: string) => {
    const data = new FormData();
    data.append("id", id);
    void deleteProjectAction(data);
    if (selectedProject?.id === id) {
      setView(ViewState.DASHBOARD);
      setSelectedProject(null);
    }
  };

  const handleNavigateHome = () => {
    setView(ViewState.DASHBOARD);
    setSelectedProject(null);
  };

  const handleNavigateApiKeys = () => {
    setView(ViewState.API_KEYS);
    setSelectedProject(null);
  };

  const handleNavigateSettings = () => {
    setView(ViewState.SETTINGS);
    setSelectedProject(null);
  };

  const handleAddEnv = (projectId: string, name: string) => {
    const data = new FormData();
    data.append("projectId", projectId);
    data.append("name", name);
    void createEnvFileAction(data);
  };

  const handleUpdateEnv = (projectId: string, envId: string, content: string) => {
    const data = new FormData();
    data.append("projectId", projectId);
    data.append("envId", envId);
    data.append("content", content);
    void updateEnvFileAction(data);
  };

  const handleDeleteEnv = (projectId: string, envId: string) => {
    const data = new FormData();
    data.append("projectId", projectId);
    data.append("envId", envId);
    void deleteEnvFileAction(data);
  };

  const currentSelected =
    selectedProject && projects.find((p) => p.id === selectedProject.id)
      ? (projects.find((p) => p.id === selectedProject.id) as Project)
      : selectedProject;

  return (
    <ThemeProvider>
      <Layout
        projects={projects}
        selectedProjectId={currentSelected?.id ?? null}
        onNavigateHome={handleNavigateHome}
        onNavigateApiKeys={handleNavigateApiKeys}
        onNavigateSettings={handleNavigateSettings}
        onSelectProject={handleSelectProject}
        isHome={view === ViewState.DASHBOARD}
        isApiKeys={view === ViewState.API_KEYS}
        isSettings={view === ViewState.SETTINGS}
        currentProjectName={currentSelected?.name}
        workspaceName={workspace?.name}
        userEmail={userEmail}
      >
        {view === ViewState.DASHBOARD && (
          <ProjectList
            projects={projects}
            onSelectProject={handleSelectProject}
            onAddProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
          />
        )}
        {view === ViewState.PROJECT_DETAIL && currentSelected && (
          <ProjectDetail
            project={currentSelected}
            onBack={handleNavigateHome}
            onAddEnv={handleAddEnv}
            onUpdateEnv={handleUpdateEnv}
            onDeleteEnv={handleDeleteEnv}
          />
        )}
        {view === ViewState.API_KEYS && (
          <ApiKeysPanel apiKeys={apiKeys} />
        )}
        {view === ViewState.SETTINGS && workspace && (
          <SettingsPanel workspace={workspace} userEmail={userEmail} />
        )}
      </Layout>
    </ThemeProvider>
  );
};

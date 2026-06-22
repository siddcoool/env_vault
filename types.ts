export interface EnvFile {
  id: string;
  name: string;
  fileLink: string;
  content: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  envFiles: EnvFile[];
  createdAt: string;
}

export enum ViewState {
  DASHBOARD = "DASHBOARD",
  PROJECT_DETAIL = "PROJECT_DETAIL",
  API_KEYS = "API_KEYS",
  SETTINGS = "SETTINGS",
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  decryptionKeyPrefix: string;
}

export interface UserInfo {
  email: string;
  name?: string;
}

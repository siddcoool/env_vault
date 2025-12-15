export interface EnvFile {
  id: string;
  name: string;
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
  DASHBOARD = 'DASHBOARD',
  PROJECT_DETAIL = 'PROJECT_DETAIL',
}



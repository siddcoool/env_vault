import { EnvVaultApp } from "./EnvVaultApp";
import { getProjectsFromDb } from "./actions";

export default async function Home() {
  const projects = await getProjectsFromDb();
  return <EnvVaultApp initialProjects={projects} />;
}

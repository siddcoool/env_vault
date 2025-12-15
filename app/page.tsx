import { EnvVaultApp } from "./EnvVaultApp";
import { getProjectsFromDb } from "./actions";
import { AppGate } from "./AppGate";

export default async function Home() {
  const projects = await getProjectsFromDb();
  return (
    <AppGate>
      <EnvVaultApp initialProjects={projects} />
    </AppGate>
  );
}

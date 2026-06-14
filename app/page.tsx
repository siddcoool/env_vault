import { EnvVaultApp } from "./EnvVaultApp";
import { getProjectsFromDb } from "./actions";
import { getApiKeysFromDb } from "./apiKeyActions";
import { AppGate } from "./AppGate";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [projects, apiKeys] = await Promise.all([
    getProjectsFromDb(),
    getApiKeysFromDb(),
  ]);
  return (
    <AppGate>
      <EnvVaultApp initialProjects={projects} initialApiKeys={apiKeys} />
    </AppGate>
  );
}

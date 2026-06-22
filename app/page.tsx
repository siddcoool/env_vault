import { EnvVaultApp } from "./EnvVaultApp";
import { getProjectsFromDb } from "./actions";
import { getApiKeysFromDb } from "./apiKeyActions";
import { getWorkspaceInfoAction } from "./workspaceActions";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  const [projects, apiKeys, workspace] = await Promise.all([
    getProjectsFromDb(),
    getApiKeysFromDb(),
    getWorkspaceInfoAction(),
  ]);

  return (
    <EnvVaultApp
      initialProjects={projects}
      initialApiKeys={apiKeys}
      workspace={workspace}
      userEmail={session.email ?? ""}
    />
  );
}

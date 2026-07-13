import { EnvVaultApp } from "./EnvVaultApp";
import { getProjectsFromDb } from "./actions";
import { getWorkspaceInfoAction } from "./workspaceActions";
import { getSession } from "@/lib/session";
import { getDocsClientScripts } from "@/lib/docs-scripts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  const [projects, workspace] = await Promise.all([
    getProjectsFromDb(),
    getWorkspaceInfoAction(),
  ]);
  const docsScripts = getDocsClientScripts();

  return (
    <EnvVaultApp
      initialProjects={projects}
      workspace={workspace}
      userEmail={session.email ?? ""}
      docsScripts={docsScripts}
    />
  );
}

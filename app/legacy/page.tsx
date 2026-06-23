import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLegacyProjects } from "@/lib/legacy-auth";
import { LegacyApp } from "./LegacyApp";

export const dynamic = "force-dynamic";

export default async function LegacyPage() {
  const session = await getSession();

  if (!session.isLegacySession) {
    redirect("/login");
  }

  const projects = await getLegacyProjects();

  return <LegacyApp initialProjects={projects} />;
}

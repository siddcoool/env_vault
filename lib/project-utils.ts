import { Project } from "@/types";

export function getProjectUpdatedAt(project: Project): Date {
  if (project.envFiles.length === 0) {
    return new Date(project.createdAt);
  }

  const latest = project.envFiles.reduce((max, file) => {
    const time = new Date(file.updatedAt).getTime();
    return time > max ? time : max;
  }, 0);

  return new Date(latest);
}

export function getRecentlyUpdatedProjects(
  projects: Project[],
  limit = 8,
): Project[] {
  return [...projects]
    .sort(
      (a, b) =>
        getProjectUpdatedAt(b).getTime() - getProjectUpdatedAt(a).getTime(),
    )
    .slice(0, limit);
}

export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

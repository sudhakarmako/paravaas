import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/core/lib/utils";

interface ProjectTabsProps {
  projectId: string;
}

/**
 * Checks if the current path matches a given tab path
 * @param currentPath - The current pathname
 * @param tabPath - The path to check against (e.g., "/datasource", "/workflow")
 * @returns true if the path matches, false otherwise
 */
function isTabActive(currentPath: string, tabPath: string): boolean {
  return currentPath.includes(tabPath);
}

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/projects/$id/dashboard" as const,
      matchPath: "/dashboard",
    },
    {
      id: "datasource",
      label: "Datasource",
      path: "/projects/$id/datasource" as const,
      matchPath: "/datasource",
    },
    {
      id: "workflow",
      label: "Workflow",
      path: "/projects/$id/workflow" as const,
      matchPath: "/workflow",
    },
    {
      id: "jobs",
      label: "Jobs",
      path: "/projects/$id/jobs" as const,
      matchPath: "/jobs",
    },
    {
      id: "settings",
      label: "Settings",
      path: "/projects/$id/settings" as const,
      matchPath: "/settings",
    },
  ];

  return (
    <div className="border-b bg-background">
      <div className="container mx-auto px-6">
        <div className="flex gap-1 border-b">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.path}
              params={{ id: projectId }}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                isTabActive(currentPath, tab.matchPath)
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

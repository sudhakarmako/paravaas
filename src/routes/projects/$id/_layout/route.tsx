import {
  createFileRoute,
  Outlet,
  Link,
  useLocation,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProject } from "@/core/services/projects";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/core/lib/utils";

export const Route = createFileRoute("/projects/$id/_layout")({
  component: ProjectLayout,
  loader: async ({ context, params }) => {
    const queryClient = (context as { queryClient?: any }).queryClient;
    if (queryClient) {
      return queryClient.ensureQueryData(getProject(params.id));
    }
  },
});

function ProjectLayout() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(getProject(id));
  const location = useLocation();

  const project = data?.project;

  // Get current route to determine active tab
  const currentPath = location.pathname;
  const activeTab = currentPath.includes("/datasource")
    ? "datasource"
    : currentPath.includes("/workflow")
      ? "workflow"
      : currentPath.includes("/jobs")
        ? "jobs"
        : "dashboard";

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <h1 className="text-2xl font-semibold">
                {project?.name || "Project"}
              </h1>
            )}
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="size-5" />
          </Button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-6">
          <div className="flex gap-1 border-b">
            <Link
              to="/projects/$id/dashboard"
              params={{ id }}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "dashboard"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              )}
            >
              Dashboard
            </Link>
            <Link
              to="/projects/$id/datasource"
              params={{ id }}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "datasource"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              )}
            >
              Datasource
            </Link>
            <Link
              to="/projects/$id/workflow"
              params={{ id }}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "workflow"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              )}
            >
              Workflow
            </Link>
            <Link
              to="/projects/$id/jobs"
              params={{ id }}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "jobs"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              )}
            >
              Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

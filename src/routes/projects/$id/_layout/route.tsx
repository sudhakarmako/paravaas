import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProject } from "@/core/services/projects";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { PROJECT_DEFAULTS } from "@/core/constants/projects";

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

  const project = data?.project;

  const IconComponent = project?.icon
    ? (Icons[project.icon as keyof typeof Icons] as
        | React.ComponentType<{ className?: string }>
        | undefined) || Icons.Folder
    : Icons.Folder;

  const iconColor = project?.color || PROJECT_DEFAULTS.COLOR;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            {isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center size-10 rounded-lg bg-muted"
                  style={{ color: iconColor }}
                >
                  {IconComponent && <IconComponent className="size-5" />}
                </div>
                <h1 className="text-2xl font-semibold">
                  {project?.name || "Project"}
                </h1>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <ProjectTabs projectId={id} />

      {/* Page Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

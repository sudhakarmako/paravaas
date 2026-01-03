import { getProjects } from "@/core/services/projects";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ProjectNewModal } from "@/components/projects/project-new-modal";
import { ProjectCard } from "@/components/projects/project-card";
import { Separator } from "@/ui";
import type { Project } from "@/core/types/projects";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { data, isLoading } = useQuery(getProjects);
  const projects = data?.projects || [];

  const pinnedProjects = projects.filter((p: Project) => p.isPinned);
  const unpinnedProjects = projects.filter((p: Project) => !p.isPinned);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <ProjectNewModal />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects yet.</p>
          <p className="text-sm text-muted-foreground">
            Create your first project to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pinnedProjects.length > 0 && (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Pinned</h2>
                <Separator />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 rounded-lg bg-muted/50">
                {pinnedProjects.map((project: Project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </>
          )}
          {unpinnedProjects.length > 0 && (
            <>
              {pinnedProjects.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">All Projects</h2>
                  <Separator />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinnedProjects.map((project: Project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

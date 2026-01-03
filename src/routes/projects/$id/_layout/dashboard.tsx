import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$id/_layout/dashboard")({
  component: ProjectDashboard,
});

function ProjectDashboard() {
  const { id } = Route.useParams();

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <p className="text-muted-foreground">Project ID: {id}</p>
      <div className="mt-6">
        <p className="text-sm text-muted-foreground">
          Dashboard content will be displayed here.
        </p>
      </div>
    </div>
  );
}

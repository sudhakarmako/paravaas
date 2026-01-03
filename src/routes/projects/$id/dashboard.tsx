import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$id/dashboard")({
  component: ProjectDashboard,
});

function ProjectDashboard() {
  const { id } = Route.useParams();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Project Dashboard</h1>
      <p className="text-muted-foreground">Project ID: {id}</p>
    </div>
  );
}

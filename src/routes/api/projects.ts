import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/projects")({
  server: {
    handlers: {
      GET: () => {
        return new Response(
          JSON.stringify({
            projects: [
              { id: 1, name: "Project 1" },
              { id: 2, name: "Project 2" },
              { id: 3, name: "Project 3" },
            ],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});

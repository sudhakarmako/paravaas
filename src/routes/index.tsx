import { Button } from "@/ui";
import { getProjects } from "@/core/services/projects";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { data } = useQuery(getProjects);

  return (
    <div>
      <h1>Hello World</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Suspense>
      <Button>test</Button>
    </div>
  );
}

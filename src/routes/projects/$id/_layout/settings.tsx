import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getProject, updateProject } from "@/core/services/projects";
import { updateProjectSchema } from "@/core/types/projects";
import type { UpdateProjectInput } from "@/core/types/projects";
import {
  Form,
  FormInput,
  FormIcon,
  Button,
  Alert,
  AlertDescription,
  Skeleton,
} from "@/components/ui";
import { ProjectDeleteDialog } from "@/components/projects/project-delete-dialog";
import { useState } from "react";
import { PROJECT_DEFAULTS } from "@/core/constants/projects";

export const Route = createFileRoute("/projects/$id/_layout/settings")({
  component: ProjectSettings,
  loader: async ({ context, params }) => {
    const queryClient = (context as { queryClient?: any }).queryClient;
    if (queryClient) {
      return queryClient.ensureQueryData(getProject(params.id));
    }
  },
});

function ProjectSettings() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading } = useQuery(getProject(id));
  const project = data?.project;

  const form = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project?.name || "",
      icon: project?.icon || PROJECT_DEFAULTS.ICON,
      color: project?.color || PROJECT_DEFAULTS.COLOR,
    },
    values: {
      name: project?.name || "",
      icon: project?.icon || PROJECT_DEFAULTS.ICON,
      color: project?.color || PROJECT_DEFAULTS.COLOR,
    },
  });

  const updateMutation = useMutation({
    ...updateProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getProject(id).queryKey,
      });
      await queryClient.refetchQueries({ queryKey: getProject(id).queryKey });
      setErrorMessage(null);
    },
    onError: (error: Error) => {
      const message =
        error.message || "Failed to update project. Please try again.";
      setErrorMessage(message);
    },
  });

  const onSubmit = (values: UpdateProjectInput) => {
    updateMutation.mutate({ id, data: values });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-destructive">Project not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-6">Project Settings</h2>

      {/* Edit Form */}
      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Edit Project</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <FormInput
                control={form.control}
                name="name"
                label="Project Name"
                placeholder="My Awesome Project"
                required
              />
              <FormIcon
                control={form.control}
                name="icon"
                colorName="color"
                label="Icon & Color"
              />
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full sm:w-auto"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Delete Section */}
        {project && <ProjectDeleteDialog project={project} projectId={id} />}
      </div>
    </div>
  );
}

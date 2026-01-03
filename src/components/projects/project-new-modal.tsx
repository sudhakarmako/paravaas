import { Button } from "@/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui";
import { Form, FormInput, FormIcon } from "@/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema } from "@/core/types/projects";
import type { CreateProjectInput } from "@/core/types/projects";
import { createProject, getProjects } from "@/core/services/projects";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/ui";

export function ProjectNewModal() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      icon: "Folder",
      color: "#3B82F6",
    },
  });

  const createProjectMutation = useMutation({
    ...createProject,
    onSuccess: async () => {
      // Invalidate and refetch the projects query
      await queryClient.invalidateQueries({ queryKey: getProjects.queryKey });
      await queryClient.refetchQueries({ queryKey: getProjects.queryKey });
      setIsDialogOpen(false);
      setErrorMessage(null);
      form.reset({
        name: "",
        icon: "Folder",
        color: "#3B82F6",
      });
    },
    onError: (error: Error) => {
      console.error("Failed to create project:", error);
      const message =
        error.message || "Failed to create project. Please try again.";
      setErrorMessage(message);
    },
  });

  const onSubmit = (values: CreateProjectInput) => {
    createProjectMutation.mutate(values);
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setErrorMessage(null);
          form.reset({
            name: "",
            icon: "Folder",
            color: "#3B82F6",
          });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter a name for your new project. You can change this later.
          </DialogDescription>
        </DialogHeader>
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

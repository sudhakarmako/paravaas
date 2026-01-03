import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { deleteProject, getProjects } from "@/core/services/projects";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Trash2 } from "lucide-react";
import type { Project } from "@/core/types/projects";

interface ProjectDeleteDialogProps {
  project: Project;
  projectId: string | number;
}

export function ProjectDeleteDialog({
  project,
  projectId,
}: ProjectDeleteDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    ...deleteProject,
    onSuccess: () => {
      // Navigate immediately for better UX
      navigate({ to: "/" });
      // Invalidate queries in the background (don't await)
      queryClient.invalidateQueries({ queryKey: getProjects.queryKey });
    },
    onError: (error: Error) => {
      const message =
        error.message || "Failed to delete project. Please try again.";
      setDeleteError(message);
    },
  });

  const handleDelete = () => {
    setDeleteError(null);
    deleteMutation.mutate(projectId);
  };

  return (
    <div className="border border-destructive rounded-lg p-6">
      <h3 className="text-lg font-medium mb-2 text-destructive">Danger Zone</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Once you delete a project, there is no going back. Please be certain.
      </p>
      {deleteError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={deleteMutation.isPending}>
            <Trash2 className="size-4 mr-2" />
            Delete Project
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project <strong>{project.name}</strong> and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="size-4 mr-2" />
              {deleteMutation.isPending && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

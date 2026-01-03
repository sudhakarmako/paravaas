import { Card, CardContent, CardHeader, CardTitle } from "@/ui";
import { Button } from "@/ui";
import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { Pin } from "lucide-react";
import type { Project } from "@/core/types/projects";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleProjectPin } from "@/core/services/projects";
import { cn } from "@/core/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const queryClient = useQueryClient();

  const togglePinMutation = useMutation({
    ...toggleProjectPin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handlePinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePinMutation.mutate({
      id: project.id,
      isPinned: !project.isPinned,
    });
  };

  const IconComponent = project.icon
    ? (Icons[project.icon as keyof typeof Icons] as
        | React.ComponentType<{ className?: string }>
        | undefined) || Icons.Folder
    : Icons.Folder;

  const iconColor = project.color || "#3B82F6";

  return (
    <Link
      to="/projects/$id/dashboard"
      params={{ id: project.id.toString() }}
      className="block"
    >
      <Card className="cursor-pointer hover:shadow-md transition-shadow relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 h-8 w-8"
          onClick={handlePinClick}
        >
          <Pin
            className={cn(
              "size-4",
              project.isPinned
                ? "fill-foreground"
                : "stroke-foreground fill-none"
            )}
          />
        </Button>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center size-12 rounded-lg bg-muted"
              style={{ color: iconColor }}
            >
              {IconComponent && <IconComponent className="size-6" />}
            </div>
            <CardTitle className="flex-1">{project.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Project ID: {project.id}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

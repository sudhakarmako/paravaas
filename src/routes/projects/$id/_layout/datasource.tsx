import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DatasourceHeader,
  DatasourceEmptyState,
  DatasourceList,
  DatasourceUploadDialog,
} from "@/components/datasource";
import { getDatasources } from "@/core/services/datasources";

export const Route = createFileRoute("/projects/$id/_layout/datasource")({
  component: DatasourcePage,
});

function DatasourcePage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const { data, isLoading } = useQuery(getDatasources(id));
  const datasources = data?.datasources || [];

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: getDatasources(id).queryKey });
  };

  return (
    <div className="container mx-auto p-6">
      <DatasourceHeader onUploadClick={() => setIsUploadDialogOpen(true)} />

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading datasources...</p>
        </div>
      ) : datasources.length === 0 ? (
        <DatasourceEmptyState
          onUploadClick={() => setIsUploadDialogOpen(true)}
        />
      ) : (
        <DatasourceList datasources={datasources} />
      )}

      <DatasourceUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        projectId={id}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}

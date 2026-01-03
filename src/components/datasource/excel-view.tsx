import { useQuery } from "@tanstack/react-query";
import { ExcelHeader } from "./excel-header";
import { DataGrid } from "./data-grid";
import { DataGridErrorBoundary } from "./data-grid-error-boundary";
import { getDatasourceData } from "@/core/services/datasources";
import { DATASOURCE_CONSTANTS } from "@/core/constants";
import type { Datasource } from "@/core/types/datasources";
import { Loader2 } from "lucide-react";

interface ExcelViewProps {
  datasource: Datasource;
  projectId: string;
}

export function ExcelView({ datasource, projectId }: ExcelViewProps) {
  // Load first batch of data - uses cached data from route loader prefetch
  const { data, isLoading, error } = useQuery(
    getDatasourceData(
      projectId,
      datasource.id,
      DATASOURCE_CONSTANTS.BATCH_SIZE,
      0
    )
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <ExcelHeader datasource={datasource} projectId={projectId} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    // Extract error message from API response
    let errorMessage = "Failed to load datasource data";
    if (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        errorMessage = String((error as { message: unknown }).message);
      } else {
        errorMessage = String(error);
      }
    }

    return (
      <div className="flex flex-col h-full">
        <ExcelHeader datasource={datasource} projectId={projectId} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-destructive max-w-2xl px-4 text-center">
            <p className="font-semibold mb-2">Error loading data</p>
            <p className="text-sm">{errorMessage}</p>
            {datasource.duckdbTableName && (
              <p className="text-xs text-muted-foreground mt-2">
                Table: {datasource.duckdbTableName}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (datasource.status !== "completed" || !datasource.duckdbTableName) {
    return (
      <div className="flex flex-col h-full">
        <ExcelHeader datasource={datasource} projectId={projectId} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">
            Datasource is not ready. Status: {datasource.status}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <ExcelHeader datasource={datasource} projectId={projectId} />
      <div className="flex-1 overflow-hidden">
        <DataGridErrorBoundary>
          <DataGrid
            projectId={projectId}
            datasourceId={datasource.id.toString()}
            columns={data.columns}
            initialData={data.data}
            total={data.pagination.total}
          />
        </DataGridErrorBoundary>
      </div>
    </div>
  );
}

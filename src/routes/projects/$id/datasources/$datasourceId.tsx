import { createFileRoute, Link } from "@tanstack/react-router";
import { getDatasource } from "@/core/services/datasources";
import { DataGrid } from "@/components/datasource/data-grid";
import { DataGridErrorBoundary } from "@/components/datasource/data-grid-error-boundary";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import {
  useDatasourceLoading,
  useDatasourceTotal,
  useDatasourceError,
} from "@/core/stores/datasource-store";

export const Route = createFileRoute("/projects/$id/datasources/$datasourceId")(
  {
    component: DatasourceViewPage,
    loader: async ({ context, params }) => {
      const queryClient = (context as { queryClient?: any }).queryClient;
      if (queryClient) {
        const datasource = await queryClient.ensureQueryData(
          getDatasource(params.id, params.datasourceId)
        );
        return datasource;
      }
    },
  }
);

function DatasourceViewPage() {
  const { id: projectId, datasourceId } = Route.useParams();
  const loaderData = Route.useLoaderData();

  const isLoading = useDatasourceLoading(datasourceId);
  const total = useDatasourceTotal(datasourceId);
  const error = useDatasourceError(datasourceId);

  if (!loaderData?.datasource) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Datasource not found</p>
      </div>
    );
  }

  const datasource = loaderData.datasource;

  // Handle datasource not ready state
  if (datasource.status !== "completed" || !datasource.duckdbTableName) {
    return (
      <div className="flex flex-col h-full bg-background">
        <Header
          projectId={projectId}
          fileName={datasource.fileName}
          isLoading={false}
          total={0}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">
            Datasource is not ready. Status: {datasource.status}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-background">
        <Header
          projectId={projectId}
          fileName={datasource.fileName}
          isLoading={false}
          total={0}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-destructive max-w-2xl px-4 text-center">
            <p className="font-semibold mb-2">Error loading data</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Section 1: Header */}
      <Header
        projectId={projectId}
        fileName={datasource.fileName}
        isLoading={isLoading}
        total={total}
      />

      {/* Section 2: DataGrid */}
      <div className="flex-1 overflow-hidden">
        <DataGridErrorBoundary>
          <DataGrid projectId={projectId} datasourceId={datasourceId} />
        </DataGridErrorBoundary>
      </div>
    </div>
  );
}

interface HeaderProps {
  projectId: string;
  fileName: string;
  isLoading: boolean;
  total: number;
}

function Header({ projectId, fileName, isLoading, total }: HeaderProps) {
  return (
    <div className="border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Back button */}
        <Link to="/projects/$id/datasource" params={{ id: projectId }}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {/* Filename */}
        <h1 className="text-lg font-semibold truncate flex-1">{fileName}</h1>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        )}

        {/* Row count */}
        {total > 0 && !isLoading && (
          <span className="text-sm text-muted-foreground">
            {total.toLocaleString()} rows
          </span>
        )}

        {/* Tools dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              Tools
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>File</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Export CSV</DropdownMenuItem>
                <DropdownMenuItem>Export JSON</DropdownMenuItem>
                <DropdownMenuItem>Statistics</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Format</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>String</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Uppercase</DropdownMenuItem>
                    <DropdownMenuItem>Lowercase</DropdownMenuItem>
                    <DropdownMenuItem>Trim</DropdownMenuItem>
                    <DropdownMenuItem>Left Trim</DropdownMenuItem>
                    <DropdownMenuItem>Right Trim</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Date</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>ISO Format</DropdownMenuItem>
                    <DropdownMenuItem>Unix Timestamp</DropdownMenuItem>
                    <DropdownMenuItem>MM/DD/YYYY</DropdownMenuItem>
                    <DropdownMenuItem>DD/MM/YYYY</DropdownMenuItem>
                    <DropdownMenuItem>YYYY-MM-DD</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Transform</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Filter Rows</DropdownMenuItem>
                <DropdownMenuItem>Sort</DropdownMenuItem>
                <DropdownMenuItem>Group By</DropdownMenuItem>
                <DropdownMenuItem>Deduplicate</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

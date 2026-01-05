import { memo } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDatasourceSelectedColumns,
  useDatasourceStore,
} from "@/core/stores/datasource-store";
import type { Datasource, DatasourceColumn } from "@/core/types/datasources";

interface ExcelHeaderProps {
  datasource: Datasource;
  projectId: string;
  columns: DatasourceColumn[];
}

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const },
  inprogress: { label: "Processing", variant: "default" as const },
  completed: { label: "Completed", variant: "default" as const },
  failed: { label: "Failed", variant: "destructive" as const },
};

export const ExcelHeader = memo(function ExcelHeader({
  datasource,
  projectId,
  columns,
}: ExcelHeaderProps) {
  const status = statusConfig[datasource.status];
  const datasourceId = String(datasource.id);

  // Column selection state from zustand (only for selectedColumns)
  const selectedColumns = useDatasourceSelectedColumns(datasourceId);
  const { clearColumnSelection } = useDatasourceStore();

  const selectedCount = selectedColumns.length;
  const totalCount = columns.length;

  return (
    <div className="border-b bg-background">
      <div className="flex items-center gap-4 px-4 py-3 border-b">
        <Link to="/projects/$id/datasource" params={{ id: projectId }}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold truncate flex-1">
          {datasource.fileName}
        </h1>
        <Badge
          variant={status.variant}
          className="shrink-0 text-xs flex items-center gap-1"
        >
          {datasource.status === "inprogress" && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {status.label}
        </Badge>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 cursor-pointer">
              File
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Export</DropdownMenuItem>
            <DropdownMenuItem>Stats</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 cursor-pointer">
              Format
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>String</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Uppercase</DropdownMenuItem>
                <DropdownMenuItem>Lowercase</DropdownMenuItem>
                <DropdownMenuItem>Ltrim</DropdownMenuItem>
                <DropdownMenuItem>Rtrim</DropdownMenuItem>
                <DropdownMenuItem>Trim</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Date</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>ISO</DropdownMenuItem>
                <DropdownMenuItem>Unix</DropdownMenuItem>
                <DropdownMenuItem>MM DD YYYY</DropdownMenuItem>
                <DropdownMenuItem>MM DD YYYY HH:AA</DropdownMenuItem>
                <DropdownMenuItem>MM DD YYYY HH:AA:SS</DropdownMenuItem>
                <DropdownMenuItem>YYYY-MM-DD</DropdownMenuItem>
                <DropdownMenuItem>DD/MM/YYYY</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Column selection indicator and actions */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            {selectedCount > 0 ? (
              <>
                <span className="text-xs text-muted-foreground">
                  {selectedCount} of {totalCount} columns selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => clearColumnSelection(datasourceId)}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                Click column headers to select
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

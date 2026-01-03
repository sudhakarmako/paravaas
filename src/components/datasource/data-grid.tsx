import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getDatasourceData } from "@/core/services/datasources";
import { DATASOURCE_CONSTANTS } from "@/core/constants";
import type { DatasourceColumn } from "@/core/types/datasources";

interface DataGridProps {
  projectId: string;
  datasourceId: string;
  columns: DatasourceColumn[];
  initialData: Record<string, any>[];
  total: number;
}

const {
  ROW_HEIGHT,
  BATCH_SIZE,
  ROW_NUMBER_WIDTH,
  COLUMN_WIDTH,
  OVERSCAN_ROWS,
} = DATASOURCE_CONSTANTS;

type RowData = Record<string, any> | null;

export function DataGrid({
  projectId,
  datasourceId,
  columns,
  initialData,
  total,
}: DataGridProps) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  // Data management with refs to avoid stale closures
  const loadedDataRef = useRef<RowData[]>(initialData);
  const loadingBatchesRef = useRef<Set<number>>(new Set());
  const loadedBatchesRef = useRef<Set<number>>(new Set([0]));

  const [loadedData, setLoadedData] = useState<RowData[]>(initialData);

  // Calculate table width
  const tableWidth = useMemo(
    () => ROW_NUMBER_WIDTH + columns.length * COLUMN_WIDTH,
    [columns.length]
  );

  // Batch loading function
  const loadBatch = useCallback(
    async (batchIndex: number) => {
      if (
        loadedBatchesRef.current.has(batchIndex) ||
        loadingBatchesRef.current.has(batchIndex)
      ) {
        return;
      }

      const offset = batchIndex * BATCH_SIZE;
      if (offset >= total) return;

      loadingBatchesRef.current.add(batchIndex);

      try {
        const limit = Math.min(BATCH_SIZE, total - offset);
        const result = await queryClient.fetchQuery(
          getDatasourceData(projectId, datasourceId, limit, offset)
        );

        const newData = [...loadedDataRef.current];
        while (newData.length < offset + result.data.length) {
          newData.push(null);
        }
        result.data.forEach((row, idx) => {
          newData[offset + idx] = row;
        });

        loadedDataRef.current = newData;
        loadedBatchesRef.current.add(batchIndex);
        setLoadedData(newData);
      } catch (error) {
        console.error(`Failed to load batch ${batchIndex}:`, error);
      } finally {
        loadingBatchesRef.current.delete(batchIndex);
      }
    },
    [queryClient, projectId, datasourceId, total]
  );

  // Generate placeholder data for the entire dataset
  const tableData = useMemo(() => {
    const data: RowData[] = [];
    for (let i = 0; i < total; i++) {
      data.push(loadedData[i] ?? null);
    }
    return data;
  }, [loadedData, total]);

  // Define columns for TanStack Table
  const tableColumns = useMemo<ColumnDef<RowData>[]>(
    () => [
      {
        id: "rowNumber",
        header: "#",
        size: ROW_NUMBER_WIDTH,
        minSize: ROW_NUMBER_WIDTH,
        maxSize: ROW_NUMBER_WIDTH,
        cell: ({ row }) => row.index + 1,
      },
      ...columns.map((col) => ({
        id: col.name,
        accessorKey: col.name,
        header: col.name,
        size: COLUMN_WIDTH,
        minSize: COLUMN_WIDTH,
        cell: ({ row }: { row: { original: RowData } }) => {
          const rowData = row.original;
          if (rowData == null) {
            return <span className="text-xs text-muted-foreground">...</span>;
          }
          const value = rowData[col.name];
          return value != null ? String(value) : "";
        },
      })),
    ],
    [columns]
  );

  // Set up TanStack Table
  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: {
      size: COLUMN_WIDTH,
      minSize: COLUMN_WIDTH,
    },
  });

  const { rows } = table.getRowModel();

  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: total,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN_ROWS,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Load batches based on visible virtual rows
  useEffect(() => {
    if (virtualRows.length === 0) return;

    const startRow = virtualRows[0].index;
    const endRow = virtualRows[virtualRows.length - 1].index;

    const startBatch = Math.floor(startRow / BATCH_SIZE);
    const endBatch = Math.floor(endRow / BATCH_SIZE);

    // Load visible batches
    for (let batch = startBatch; batch <= endBatch; batch++) {
      loadBatch(batch);
    }

    // Preload next batch
    const nextBatch = endBatch + 1;
    if (nextBatch * BATCH_SIZE < total) {
      loadBatch(nextBatch);
    }
  }, [virtualRows, loadBatch, total]);

  // Calculate padding for virtual scroll
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <div className="h-full overflow-auto" ref={containerRef}>
      <div
        style={{
          minHeight: `${rowVirtualizer.getTotalSize()}px`,
          width: `${tableWidth}px`,
        }}
      >
        <table
          className="border-collapse"
          style={{ tableLayout: "fixed", width: `${tableWidth}px` }}
        >
          <thead
            className="sticky top-0 z-30 bg-background"
            style={{ position: "sticky", top: 0 }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isRowNumber = header.id === "rowNumber";
                  return (
                    <th
                      key={header.id}
                      className="bg-muted border-r border-b px-2 py-1.5 text-xs font-semibold text-muted-foreground truncate"
                      style={{
                        width: header.getSize(),
                        minWidth: header.getSize(),
                        maxWidth: isRowNumber ? header.getSize() : undefined,
                        position: isRowNumber ? "sticky" : "sticky",
                        left: isRowNumber ? 0 : undefined,
                        top: 0,
                        zIndex: isRowNumber ? 40 : 30,
                        boxShadow: isRowNumber
                          ? "2px 0 4px rgba(0,0,0,0.1)"
                          : undefined,
                        textAlign: isRowNumber ? "center" : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  style={{
                    height: `${paddingTop}px`,
                    padding: 0,
                    border: "none",
                  }}
                />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;

              const rowData = row.original;
              const hasData = rowData != null;

              return (
                <tr
                  key={row.id}
                  className={hasData ? "hover:bg-muted/50" : "bg-muted/20"}
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isRowNumber = cell.column.id === "rowNumber";
                    return (
                      <td
                        key={cell.id}
                        className={`border-r border-b px-2 py-1 text-sm truncate ${
                          isRowNumber
                            ? "bg-muted text-muted-foreground text-center"
                            : ""
                        }`}
                        style={{
                          width: cell.column.getSize(),
                          minWidth: cell.column.getSize(),
                          maxWidth: isRowNumber
                            ? cell.column.getSize()
                            : undefined,
                          position: isRowNumber ? "sticky" : undefined,
                          left: isRowNumber ? 0 : undefined,
                          zIndex: isRowNumber ? 20 : undefined,
                          boxShadow: isRowNumber
                            ? "2px 0 4px rgba(0,0,0,0.1)"
                            : undefined,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  style={{
                    height: `${paddingBottom}px`,
                    padding: 0,
                    border: "none",
                  }}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

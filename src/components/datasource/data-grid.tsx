import { useRef, useMemo, useReducer, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getDatasourceData } from "@/core/services/datasources";
import { DATASOURCE_CONSTANTS } from "@/core/constants";
import {
  useDatasourceSelectedColumns,
  useDatasourceStore,
} from "@/core/stores/datasource-store";
import type { DatasourceColumn } from "@/core/types/datasources";
import { cn } from "@/core/lib/utils";

interface DataGridProps {
  projectId: string;
  datasourceId: string;
  columns: DatasourceColumn[];
  total: number;
}

const {
  ROW_HEIGHT,
  BATCH_SIZE,
  ROW_NUMBER_WIDTH,
  COLUMN_WIDTH,
  OVERSCAN_ROWS,
} = DATASOURCE_CONSTANTS;

type RowData = Record<string, any>;
type RowStore = Map<number, RowData>;

export function DataGrid({
  projectId,
  datasourceId,
  columns,
  total,
}: DataGridProps) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  // Column selection from zustand store
  const selectedColumns = useDatasourceSelectedColumns(datasourceId);
  const { toggleColumnSelection } = useDatasourceStore();

  /* ------------------ DATA STORE (SPARSE) ------------------ */

  // Sparse data store - loads on-demand as user scrolls
  const dataRef = useRef<RowStore>(new Map());
  const loadingBatches = useRef<Set<number>>(new Set());
  const loadedBatches = useRef<Set<number>>(new Set());

  // Force render using reducer instead of state to avoid array cloning
  const [, forceRender] = useReducer((x) => x + 1, 0);

  /* ------------------ DIMENSIONS ------------------ */

  const columnCount = columns.length + 1; // +1 for row number column
  const totalWidth = ROW_NUMBER_WIDTH + columns.length * COLUMN_WIDTH;

  /* ------------------ ROW VIRTUALIZATION ------------------ */

  const rowVirtualizer = useVirtualizer({
    count: total,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN_ROWS,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  /* ------------------ COLUMN VIRTUALIZATION ------------------ */

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columnCount,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) => (index === 0 ? ROW_NUMBER_WIDTH : COLUMN_WIDTH),
    overscan: 3,
  });

  const virtualColumns = columnVirtualizer.getVirtualItems();

  /* ------------------ BATCH LOADER ------------------ */

  const loadBatch = useCallback(
    async (batchIndex: number) => {
      if (
        loadedBatches.current.has(batchIndex) ||
        loadingBatches.current.has(batchIndex)
      ) {
        return;
      }

      const offset = batchIndex * BATCH_SIZE;
      if (offset >= total) return;

      loadingBatches.current.add(batchIndex);

      try {
        const limit = Math.min(BATCH_SIZE, total - offset);

        const result = await queryClient.fetchQuery(
          getDatasourceData(projectId, datasourceId, limit, offset)
        );

        result.data.forEach((row, i) => {
          dataRef.current.set(offset + i, row);
        });

        loadedBatches.current.add(batchIndex);
        forceRender();
      } catch (err) {
        console.error("Batch load failed", err);
      } finally {
        loadingBatches.current.delete(batchIndex);
      }
    },
    [queryClient, projectId, datasourceId, total]
  );

  /* ------------------ LOAD VISIBLE BATCHES (during render) ------------------ */

  // Trigger batch loading synchronously during render
  // This replaces the useEffect pattern and is safe because loadBatch
  // guards against duplicate loading with refs
  if (virtualRows.length > 0) {
    const start = virtualRows[0].index;
    const end = virtualRows[virtualRows.length - 1].index;

    const startBatch = Math.floor(start / BATCH_SIZE);
    const endBatch = Math.floor(end / BATCH_SIZE);

    // Load visible batches
    for (let b = startBatch; b <= endBatch; b++) {
      loadBatch(b);
    }

    // Prefetch next batch
    const nextBatch = endBatch + 1;
    if (nextBatch * BATCH_SIZE < total) {
      loadBatch(nextBatch);
    }
  }

  /* ------------------ COLUMN CLICK HANDLER ------------------ */

  const handleColumnHeaderClick = useCallback(
    (columnName: string) => {
      toggleColumnSelection(datasourceId, columnName);
    },
    [datasourceId, toggleColumnSelection]
  );

  /* ------------------ HEADER ROW ------------------ */

  const headerRow = useMemo(() => {
    return (
      <div
        className="sticky top-0 z-30 bg-muted border-b"
        style={{
          height: ROW_HEIGHT,
          width: totalWidth,
          position: "relative",
        }}
      >
        {virtualColumns.map((vCol) => {
          const colIndex = vCol.index;

          // Row number header
          if (colIndex === 0) {
            return (
              <div
                key="rownum-header"
                className="absolute left-0 top-0 border-r bg-muted px-2 py-1.5 text-xs font-semibold text-muted-foreground text-center flex items-center justify-center"
                style={{
                  width: ROW_NUMBER_WIDTH,
                  height: ROW_HEIGHT,
                  zIndex: 40,
                  boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
                }}
              >
                #
              </div>
            );
          }

          // Data column header
          const column = columns[colIndex - 1];
          const isSelected = selectedColumns.includes(column.name);

          return (
            <div
              key={column.name}
              onClick={() => handleColumnHeaderClick(column.name)}
              className={cn(
                "absolute top-0 border-r px-2 py-1.5 text-xs font-semibold truncate flex items-center cursor-pointer transition-colors select-none",
                isSelected
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "text-muted-foreground hover:bg-muted/80"
              )}
              style={{
                left: vCol.start,
                width: COLUMN_WIDTH,
                height: ROW_HEIGHT,
              }}
              title={`Click to ${isSelected ? "deselect" : "select"} column: ${column.name}`}
            >
              {column.name}
            </div>
          );
        })}
      </div>
    );
  }, [
    virtualColumns,
    columns,
    totalWidth,
    selectedColumns,
    handleColumnHeaderClick,
  ]);

  /* ------------------ RENDER ------------------ */

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-auto bg-background"
    >
      {/* Scroll container */}
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: columnVirtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        {/* Header */}
        {headerRow}

        {/* Rows */}
        {virtualRows.map((vRow) => {
          const rowIndex = vRow.index;
          const rowData = dataRef.current.get(rowIndex);
          const hasData = rowData != null;

          return (
            <div
              key={rowIndex}
              className={`absolute border-b ${
                hasData ? "hover:bg-muted/50" : "bg-muted/20"
              }`}
              style={{
                transform: `translateY(${vRow.start + ROW_HEIGHT}px)`,
                height: ROW_HEIGHT,
                width: totalWidth,
              }}
            >
              {virtualColumns.map((vCol) => {
                const colIndex = vCol.index;

                /* Row number column */
                if (colIndex === 0) {
                  return (
                    <div
                      key="rownum"
                      className="absolute left-0 top-0 border-r bg-muted text-center text-xs text-muted-foreground flex items-center justify-center"
                      style={{
                        width: ROW_NUMBER_WIDTH,
                        height: ROW_HEIGHT,
                        zIndex: 20,
                        boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      {rowIndex + 1}
                    </div>
                  );
                }

                /* Data column */
                const column = columns[colIndex - 1];
                const value = rowData?.[column.name];
                const isSelected = selectedColumns.includes(column.name);

                return (
                  <div
                    key={column.name}
                    className={cn(
                      "absolute top-0 border-r px-2 truncate text-sm flex items-center",
                      isSelected && "bg-primary/5"
                    )}
                    style={{
                      left: vCol.start,
                      width: COLUMN_WIDTH,
                      height: ROW_HEIGHT,
                    }}
                  >
                    {value != null ? (
                      String(value)
                    ) : (
                      <span className="text-muted-foreground text-xs">…</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

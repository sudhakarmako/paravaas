import { useRef, useCallback, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DATASOURCE_CONSTANTS } from "@/core/constants";
import {
  useDatasourceColumns,
  useDatasourceTotal,
  useDatasourceLoadedCount,
  useDatasourceSelectedColumns,
  useDatasourceLoading,
  useDatasourceError,
  useDatasourceStore,
  useDatasourceVersion,
} from "@/core/stores/datasource-store";
import { cn } from "@/core/lib/utils";
import { loadBatch } from "@/core/services/datasource-stream";
import { Loader2 } from "lucide-react";

interface DataGridProps {
  projectId: string;
  datasourceId: string;
}

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 40;
const ROW_NUMBER_WIDTH = 64;
const MIN_COLUMN_WIDTH = 120;
const BATCH_SIZE = DATASOURCE_CONSTANTS.BATCH_SIZE;

export function DataGrid({ projectId, datasourceId }: DataGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const streamStartedRef = useRef(false);

  // Read from zustand store
  const columns = useDatasourceColumns(datasourceId);
  const total = useDatasourceTotal(datasourceId);
  const loadedCount = useDatasourceLoadedCount(datasourceId);
  const selectedColumns = useDatasourceSelectedColumns(datasourceId);
  const isLoading = useDatasourceLoading(datasourceId);
  const error = useDatasourceError(datasourceId);
  // Important: subscription to version triggers re-renders when data arrives
  useDatasourceVersion(datasourceId);

  const store = useDatasourceStore();

  // Load chunk on demand
  const loadChunk = useCallback(
    (startRow: number, endRow: number) => {
      const startBatch = Math.floor(startRow / BATCH_SIZE);
      const endBatch = Math.floor(endRow / BATCH_SIZE);

      for (let batch = startBatch; batch <= endBatch; batch++) {
        if (
          !store.isBatchLoaded(datasourceId, batch) &&
          !store.isBatchLoading(datasourceId, batch)
        ) {
          store.markBatchLoading(datasourceId, batch);
          loadBatch(projectId, datasourceId, batch).catch((err) => {
            console.error(`Failed to load batch ${batch}:`, err);
          });
        }
      }
    },
    [datasourceId, store, projectId]
  );

  // Start initial data fetch
  useEffect(() => {
    if (streamStartedRef.current) return;
    streamStartedRef.current = true;

    const fetchData = async () => {
      store.setLoading(datasourceId, true);
      try {
        const response = await fetch(
          `/api/projects/${projectId}/datasources/${datasourceId}/data?limit=1000&offset=0`
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        if (result && result.columns && result.data) {
          store.initializeDatasource(
            datasourceId,
            result.columns,
            result.pagination.total
          );
          store.appendBatch(datasourceId, 0, result.data, 0);
          store.setLoading(datasourceId, false);
        }
      } catch (err) {
        store.setError(
          datasourceId,
          err instanceof Error ? err.message : String(err)
        );
      }
    };

    fetchData();
  }, [projectId, datasourceId, store]);

  const getColumnWidth = useCallback(() => {
    if (!containerRef.current || columns.length === 0) return MIN_COLUMN_WIDTH;
    const availableWidth = containerRef.current.clientWidth - ROW_NUMBER_WIDTH;
    return Math.max(
      Math.floor(availableWidth / columns.length),
      MIN_COLUMN_WIDTH
    );
  }, [columns.length]);

  const columnWidth = getColumnWidth();
  const totalWidth = ROW_NUMBER_WIDTH + columns.length * columnWidth;

  const rowVirtualizer = useVirtualizer({
    count: total,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
    onChange: (instance) => {
      const items = instance.getVirtualItems();
      if (items.length > 0) {
        const bufferStart = Math.max(0, items[0].index - 50);
        const bufferEnd = Math.min(
          total - 1,
          items[items.length - 1].index + 50
        );
        loadChunk(bufferStart, bufferEnd);
      }
    },
  });

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
        <p className="font-medium">Error loading data</p>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    );

  if (columns.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading metadata...</p>
      </div>
    );

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <div
        className="shrink-0 border-b border-border bg-muted/50 overflow-hidden"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex h-full" style={{ width: totalWidth }}>
          <div
            className="shrink-0 flex items-center justify-center border-r border-border bg-muted font-medium text-xs text-muted-foreground"
            style={{ width: ROW_NUMBER_WIDTH }}
          >
            #
          </div>
          {columns.map((column) => {
            const isSelected = selectedColumns.includes(column.name);
            return (
              <div
                key={column.name}
                onClick={() =>
                  store.toggleColumnSelection(datasourceId, column.name)
                }
                className={cn(
                  "shrink-0 flex items-center px-3 border-r border-border cursor-pointer select-none font-medium text-xs truncate transition-colors",
                  isSelected
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
                style={{ width: columnWidth }}
              >
                {column.name}
              </div>
            );
          })}
        </div>
      </div>;
      {
        /* Loading bar */
      }
      {
        /* {
        (isLoading || loadedCount < total) && (
          <div className="shrink-0 px-3 py-1 bg-muted/30 border-b border-border text-[10px] text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>
              {loadedCount > 0
                ? `Loaded ${loadedCount.toLocaleString()} of ${total.toLocaleString()} rows`
                : "Connecting..."}
            </span>
          </div>
        );
      } */
      }
      {
        /* Body */
      }
      <div ref={containerRef} className="flex-1 overflow-auto">
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            width: totalWidth,
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowData = store.getRow(datasourceId, virtualRow.index);
            const isEven = virtualRow.index % 2 === 0;
            return (
              <div
                key={virtualRow.key}
                className={cn(
                  "absolute left-0 right-0 flex border-b border-border/50",
                  isEven ? "bg-background" : "bg-muted/10",
                  rowData && "hover:bg-accent/30"
                )}
                style={{
                  top: virtualRow.start,
                  height: ROW_HEIGHT,
                  width: totalWidth,
                }}
              >
                <div
                  className="shrink-0 flex items-center justify-center border-r border-border/50 text-[10px] text-muted-foreground font-mono bg-muted/20"
                  style={{ width: ROW_NUMBER_WIDTH }}
                >
                  {virtualRow.index + 1}
                </div>
                {columns.map((column) => {
                  const val = rowData?.[column.name];
                  return (
                    <div
                      key={column.name}
                      className={cn(
                        "shrink-0 flex items-center px-3 border-r border-border/50 text-sm truncate",
                        selectedColumns.includes(column.name) && "bg-primary/5"
                      )}
                      style={{ width: columnWidth }}
                    >
                      {rowData ? (
                        val !== null && val !== undefined ? (
                          String(val)
                        ) : (
                          <span className="text-muted-foreground/30 italic text-xs">
                            null
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground/20 animate-pulse">
                          ···
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>;
    </div>
  );
}

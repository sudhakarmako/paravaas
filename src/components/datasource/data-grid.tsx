import { useRef, useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  OVERSCAN_ROWS: OVERSCAN,
  SCROLL_DEBOUNCE_MS,
} = DATASOURCE_CONSTANTS;

export function DataGrid({
  projectId,
  datasourceId,
  columns,
  initialData,
  total,
}: DataGridProps) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  // Use refs to avoid stale closures
  const loadedDataRef = useRef<(Record<string, any> | null)[]>(initialData);
  const loadingBatchesRef = useRef<Set<number>>(new Set());
  const loadedBatchesRef = useRef<Set<number>>(new Set([0])); // Batch 0 is initially loaded
  const loadBatchRef = useRef<((batchIndex: number) => Promise<void>) | null>(
    null
  );

  const [loadedData, setLoadedData] =
    useState<(Record<string, any> | null)[]>(initialData);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });

  // Calculate table width
  const tableWidth = useMemo(
    () => ROW_NUMBER_WIDTH + columns.length * COLUMN_WIDTH,
    [columns.length]
  );

  // Load a specific batch - store in ref for stable access
  loadBatchRef.current = async (batchIndex: number) => {
    // Check if already loaded or loading
    if (
      loadedBatchesRef.current.has(batchIndex) ||
      loadingBatchesRef.current.has(batchIndex)
    ) {
      return;
    }

    const offset = batchIndex * BATCH_SIZE;
    if (offset >= total) return;

    // Mark as loading
    loadingBatchesRef.current.add(batchIndex);

    try {
      const limit = Math.min(BATCH_SIZE, total - offset);
      const result = await queryClient.fetchQuery(
        getDatasourceData(projectId, datasourceId, limit, offset)
      );

      // Update the data array
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
  };

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop = container.scrollTop;
        const height = container.clientHeight;

        const startRow = Math.max(
          0,
          Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN
        );
        const endRow = Math.min(
          total,
          Math.ceil((scrollTop + height) / ROW_HEIGHT) + OVERSCAN
        );

        setVisibleRange({ start: startRow, end: endRow });

        // Determine which batches we need
        const startBatch = Math.floor(startRow / BATCH_SIZE);
        const endBatch = Math.floor(endRow / BATCH_SIZE);

        // Load missing batches
        for (let batch = startBatch; batch <= endBatch; batch++) {
          loadBatchRef.current?.(batch);
        }

        // Preload next batch
        const nextBatch = endBatch + 1;
        if (nextBatch * BATCH_SIZE < total) {
          loadBatchRef.current?.(nextBatch);
        }
      }, SCROLL_DEBOUNCE_MS);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    // Initial setup
    const initialHeight = container.clientHeight || 600;
    const initialEnd = Math.min(
      total,
      Math.ceil(initialHeight / ROW_HEIGHT) + OVERSCAN
    );
    setVisibleRange({ start: 0, end: initialEnd });

    // Trigger initial scroll handler after a small delay to ensure refs are set
    const initialTimeout = setTimeout(handleScroll, 10);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
      clearTimeout(initialTimeout);
    };
  };, [total]);

  // Generate rows to render
  const rows = useMemo(() => {
    const result: number[] = [];
    for (
      let i = visibleRange.start;
      i < Math.min(visibleRange.end, total);
      i++
    ) {
      result.push(i);
    }
    return result;
  }, [visibleRange.start, visibleRange.end, total]);

  return (
    <div className="h-full overflow-auto" ref={containerRef}>
      <div
        style={{
          minHeight: `${total * ROW_HEIGHT}px`,
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
            <tr>
              <th
                className="bg-muted border-r border-b px-2 py-1.5 text-xs font-semibold text-muted-foreground text-center"
                style={{
                  width: ROW_NUMBER_WIDTH,
                  minWidth: ROW_NUMBER_WIDTH,
                  maxWidth: ROW_NUMBER_WIDTH,
                  position: "sticky",
                  left: 0,
                  top: 0,
                  zIndex: 40,
                  boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
                }}
              >
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.name}
                  className="border-r border-b px-2 py-1.5 text-xs font-semibold text-muted-foreground truncate bg-muted"
                  style={{
                    width: COLUMN_WIDTH,
                    minWidth: COLUMN_WIDTH,
                    position: "sticky",
                    top: 0,
                  }}
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRange.start > 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  style={{
                    height: `${visibleRange.start * ROW_HEIGHT}px`,
                    padding: 0,
                    border: "none",
                  }}
                />
              </tr>
            )}
            {rows.map((idx) => {
              const rowData = loadedData[idx];
              const hasData = rowData != null;

              if (!hasData) {
                return (
                  <tr key={idx} className="bg-muted/20">
                    <td
                      className="bg-muted border-r border-b px-2 py-1 text-sm text-center text-muted-foreground"
                      style={{
                        width: ROW_NUMBER_WIDTH,
                        minWidth: ROW_NUMBER_WIDTH,
                        position: "sticky",
                        left: 0,
                        zIndex: 20,
                        boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      {idx + 1}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.name}
                        className="border-r border-b px-2 py-1 text-sm text-muted-foreground"
                      >
                        <span className="text-xs">...</span>
                      </td>
                    ))}
                  </tr>
                );
              }

              return (
                <tr key={idx} className="hover:bg-muted/50">
                  <td
                    className="bg-muted border-r border-b px-2 py-1 text-sm text-muted-foreground text-center"
                    style={{
                      width: ROW_NUMBER_WIDTH,
                      minWidth: ROW_NUMBER_WIDTH,
                      position: "sticky",
                      left: 0,
                      zIndex: 20,
                      boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {idx + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.name}
                      className="border-r border-b px-2 py-1 text-sm truncate"
                    >
                      {rowData[col.name] != null
                        ? String(rowData[col.name])
                        : ""}
                    </td>
                  ))}
                </tr>
              );
            })}
            {visibleRange.end < total && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  style={{
                    height: `${(total - visibleRange.end) * ROW_HEIGHT}px`,
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

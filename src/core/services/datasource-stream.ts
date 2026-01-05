import { useDatasourceStore } from "@/core/stores/datasource-store";
import type { DatasourceColumn } from "@/core/types/datasources";
import { DATASOURCE_CONSTANTS } from "@/core/constants";

interface StreamMetadata {
  type: "metadata";
  columns: DatasourceColumn[];
  total: number;
  batchSize: number;
}

interface StreamBatch {
  type: "batch";
  offset: number;
  data: Record<string, any>[];
}

interface StreamComplete {
  type: "complete";
  totalLoaded: number;
}

interface StreamError {
  type: "error";
  error: string;
}

type StreamMessage = StreamMetadata | StreamBatch | StreamComplete | StreamError;

interface StreamController {
  abort: () => void;
  isAborted: boolean;
}

// Track active streams per datasource for cleanup
const activeStreams = new Map<string, AbortController>();

/**
 * Abort any active stream for a datasource
 */
export function abortDatasourceStream(datasourceId: string): void {
  const controller = activeStreams.get(datasourceId);
  if (controller) {
    controller.abort();
    activeStreams.delete(datasourceId);
  }
}

/**
 * Stream data from API into zustand store
 */
export async function streamDatasourceData(
  projectId: string | number,
  datasourceId: string | number,
  options: {
    limit?: number;
    offset?: number;
    onMetadata?: (metadata: StreamMetadata) => void;
    onBatch?: (batch: StreamBatch) => void;
    onComplete?: (complete: StreamComplete) => void;
    onError?: (error: string) => void;
  } = {}
): Promise<StreamController> {
  const dsId = String(datasourceId);
  const store = useDatasourceStore.getState();

  // Abort any existing stream for this datasource
  abortDatasourceStream(dsId);

  // Create new abort controller
  const abortController = new AbortController();
  activeStreams.set(dsId, abortController);

  const {
    limit = DATASOURCE_CONSTANTS.MAX_BATCH_SIZE,
    offset = 0,
    onMetadata,
    onBatch,
    onComplete,
    onError,
  } = options;

  const controller: StreamController = {
    abort: () => {
      abortController.abort();
      activeStreams.delete(dsId);
    },
    isAborted: false,
  };

  // Set loading state
  store.setLoading(dsId, true);

  try {
    const response = await fetch(
      `/api/projects/${projectId}/datasources/${datasourceId}/data?stream=true&limit=${limit}&offset=${offset}`,
      {
        signal: abortController.signal,
        headers: {
          Accept: "application/x-ndjson",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let batchIndex = Math.floor(offset / DATASOURCE_CONSTANTS.BATCH_SIZE);

    while (true) {
      if (abortController.signal.aborted) {
        controller.isAborted = true;
        break;
      }

      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const message: StreamMessage = JSON.parse(line);

          switch (message.type) {
            case "metadata":
              // Initialize store with metadata
              store.initializeDatasource(dsId, message.columns, message.total);
              onMetadata?.(message);
              break;

            case "batch":
              // Append batch to store
              store.appendBatch(dsId, batchIndex, message.data, message.offset);
              batchIndex++;
              onBatch?.(message);
              break;

            case "complete":
              store.setLoading(dsId, false);
              onComplete?.(message);
              break;

            case "error":
              store.setError(dsId, message.error);
              onError?.(message.error);
              break;
          }
        } catch (parseError) {
          console.error("Failed to parse stream message:", parseError, line);
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      try {
        const message: StreamMessage = JSON.parse(buffer);
        if (message.type === "complete") {
          store.setLoading(dsId, false);
          onComplete?.(message);
        } else if (message.type === "error") {
          store.setError(dsId, message.error);
          onError?.(message.error);
        }
      } catch (parseError) {
        console.error("Failed to parse final stream message:", parseError);
      }
    }

    store.setLoading(dsId, false);
    activeStreams.delete(dsId);
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      controller.isAborted = true;
      store.setLoading(dsId, false);
    } else {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      store.setError(dsId, errorMessage);
      onError?.(errorMessage);
    }
    activeStreams.delete(dsId);
  }

  return controller;
}

/**
 * Load a specific batch on demand (for scroll-triggered loading)
 */
export async function loadBatch(
  projectId: string | number,
  datasourceId: string | number,
  batchIndex: number
): Promise<void> {
  const dsId = String(datasourceId);
  const store = useDatasourceStore.getState();
  const state = store.getDatasourceState(dsId);

  if (!state) {
    console.error("Datasource not initialized:", dsId);
    return;
  }

  // Check if batch is already loaded
  if (state.loadedBatches.has(batchIndex)) {
    return;
  }

  const offset = batchIndex * DATASOURCE_CONSTANTS.BATCH_SIZE;
  if (offset >= state.total) return;

  const limit = Math.min(DATASOURCE_CONSTANTS.BATCH_SIZE, state.total - offset);

  try {
    const response = await fetch(
      `/api/projects/${projectId}/datasources/${datasourceId}/data?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      store.appendBatch(dsId, batchIndex, result.data.data, offset);
    }
  } catch (error) {
    console.error(`Failed to load batch ${batchIndex}:`, error);
  }
}

/**
 * Reset stream and clear data for a datasource
 * Call this after computations/transformations
 */
export function resetDatasourceStream(datasourceId: string): void {
  abortDatasourceStream(datasourceId);
  const store = useDatasourceStore.getState();
  store.resetStream(datasourceId);
}

/**
 * Clean up all resources for a datasource
 */
export function cleanupDatasource(datasourceId: string): void {
  abortDatasourceStream(datasourceId);
  const store = useDatasourceStore.getState();
  store.clearData(datasourceId);
}


import { create } from "zustand";
import type { DatasourceColumn } from "@/core/types/datasources";

export type RowData = Record<string, any>;

export interface DatasourceState {
  // Sparse data storage - Map is shared across renders but row data is appended
  dataMap: Map<number, RowData>;
  selectedColumns: string[];
  columns: DatasourceColumn[];
  total: number;
  loadedCount: number;
  isLoading: boolean;
  loadingBatches: Set<number>;
  loadedBatches: Set<number>;
  error: string | null;
  // Version counter to trigger re-renders without cloning the whole dataMap
  version: number;
}

interface DatasourceStore {
  datasources: Record<string, DatasourceState>;

  // Actions
  initializeDatasource: (
    datasourceId: string,
    columns: DatasourceColumn[],
    total: number
  ) => void;
  appendBatch: (
    datasourceId: string,
    batchIndex: number,
    data: RowData[],
    offset: number
  ) => void;
  markBatchLoading: (datasourceId: string, batchIndex: number) => void;
  setSelectedColumns: (datasourceId: string, columns: string[]) => void;
  toggleColumnSelection: (datasourceId: string, columnName: string) => void;
  setLoading: (datasourceId: string, isLoading: boolean) => void;
  setError: (datasourceId: string, error: string | null) => void;
  resetStream: (datasourceId: string) => void;
  getRow: (datasourceId: string, index: number) => RowData | undefined;
  isBatchLoaded: (datasourceId: string, batchIndex: number) => boolean;
  isBatchLoading: (datasourceId: string, batchIndex: number) => boolean;
}

const getDefaultState = (): DatasourceState => ({
  dataMap: new Map(),
  selectedColumns: [],
  columns: [],
  total: 0,
  loadedCount: 0,
  isLoading: false,
  loadingBatches: new Set(),
  loadedBatches: new Set(),
  error: null,
  version: 0,
});

export const useDatasourceStore = create<DatasourceStore>((set, get) => ({
  datasources: {},

  initializeDatasource: (datasourceId, columns, total) => {
    set((state) => ({
      datasources: {
        ...state.datasources,
        [datasourceId]: {
          ...getDefaultState(),
          columns,
          total,
        },
      },
    }));
  },

  appendBatch: (datasourceId, batchIndex, batchData, offset) => {
    set((state) => {
      const existing = state.datasources[datasourceId];
      if (!existing) return state;

      // Update the existing map in-place to avoid giant clones
      batchData.forEach((row, idx) => {
        existing.dataMap.set(offset + idx, row);
      });

      // Update version and sets
      const newLoadedBatches = new Set(existing.loadedBatches);
      newLoadedBatches.add(batchIndex);

      const newLoadingBatches = new Set(existing.loadingBatches);
      newLoadingBatches.delete(batchIndex);

      return {
        datasources: {
          ...state.datasources,
          [datasourceId]: {
            ...existing,
            loadedCount: existing.dataMap.size,
            loadedBatches: newLoadedBatches,
            loadingBatches: newLoadingBatches,
            version: existing.version + 1,
          },
        },
      };
    });
  },

  markBatchLoading: (datasourceId, batchIndex) => {
    set((state) => {
      const existing = state.datasources[datasourceId];
      if (!existing) return state;

      const newLoadingBatches = new Set(existing.loadingBatches);
      newLoadingBatches.add(batchIndex);

      return {
        datasources: {
          ...state.datasources,
          [datasourceId]: {
            ...existing,
            loadingBatches: newLoadingBatches,
          },
        },
      };
    });
  },

  setSelectedColumns: (datasourceId, columns) => {
    set((state) => {
      const existing = state.datasources[datasourceId];
      if (!existing) return state;
      return {
        datasources: {
          ...state.datasources,
          [datasourceId]: { ...existing, selectedColumns: columns },
        },
      };
    });
  },

  toggleColumnSelection: (datasourceId, columnName) => {
    set((state) => {
      const existing = state.datasources[datasourceId];
      if (!existing) return state;
      const isSelected = existing.selectedColumns.includes(columnName);
      const newSelected = isSelected
        ? existing.selectedColumns.filter((c) => c !== columnName)
        : [...existing.selectedColumns, columnName];
      return {
        datasources: {
          ...state.datasources,
          [datasourceId]: { ...existing, selectedColumns: newSelected },
        },
      };
    });
  },

  setLoading: (datasourceId, isLoading) => {
    set((state) => {
      const existing = state.datasources[datasourceId];
      if (!existing) return state;
      return {
        datasources: {
          ...state.datasources,
          [datasourceId]: { ...existing, isLoading },
        },
      };
    });
  },

  setError: (datasourceId, error) => {
    set((state) => {
      const existing = state.datasources[datasourceId];
      if (!existing) return state;
      return {
        datasources: {
          ...state.datasources,
          [datasourceId]: { ...existing, error, isLoading: false },
        },
      };
    });
  },

  resetStream: (datasourceId) => {
    set((state) => {
      const existing = state.datasources[datasourceId];
      if (!existing) return state;
      return {
        datasources: {
          ...state.datasources,
          [datasourceId]: {
            ...existing,
            dataMap: new Map(),
            loadedCount: 0,
            loadedBatches: new Set(),
            loadingBatches: new Set(),
            isLoading: false,
            error: null,
            version: 0,
          },
        },
      };
    });
  },

  getRow: (datasourceId, index) => {
    return get().datasources[datasourceId]?.dataMap.get(index);
  },

  isBatchLoaded: (datasourceId, batchIndex) => {
    return (
      get().datasources[datasourceId]?.loadedBatches.has(batchIndex) ?? false
    );
  },

  isBatchLoading: (datasourceId, batchIndex) => {
    return (
      get().datasources[datasourceId]?.loadingBatches.has(batchIndex) ?? false
    );
  },
}));

// Selectors
export const useDatasourceColumns = (datasourceId: string) =>
  useDatasourceStore((state) => state.datasources[datasourceId]?.columns ?? []);

export const useDatasourceSelectedColumns = (datasourceId: string) =>
  useDatasourceStore(
    (state) => state.datasources[datasourceId]?.selectedColumns ?? []
  );

export const useDatasourceTotal = (datasourceId: string) =>
  useDatasourceStore((state) => state.datasources[datasourceId]?.total ?? 0);

export const useDatasourceLoadedCount = (datasourceId: string) =>
  useDatasourceStore(
    (state) => state.datasources[datasourceId]?.loadedCount ?? 0
  );

export const useDatasourceLoading = (datasourceId: string) =>
  useDatasourceStore(
    (state) => state.datasources[datasourceId]?.isLoading ?? false
  );

export const useDatasourceError = (datasourceId: string) =>
  useDatasourceStore((state) => state.datasources[datasourceId]?.error ?? null);

// Hook to trigger re-render on data change
export const useDatasourceVersion = (datasourceId: string) =>
  useDatasourceStore((state) => state.datasources[datasourceId]?.version ?? 0);

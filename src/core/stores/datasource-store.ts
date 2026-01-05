import { create } from "zustand";
import type { DatasourceColumn } from "@/core/types/datasources";

export type RowData = Record<string, any> | null;

export interface DatasourceState {
  data: RowData[];
  selectedColumns: string[];
  columns: DatasourceColumn[];
  total: number;
  isLoading: boolean;
  loadedBatches: Set<number>;
  error: string | null;
}

interface DatasourceStore {
  // Per-datasource state map
  datasources: Record<string, DatasourceState>;

  // Actions
  initializeDatasource: (
    datasourceId: string,
    columns: DatasourceColumn[],
    total: number
  ) => void;
  setData: (datasourceId: string, data: RowData[]) => void;
  appendBatch: (
    datasourceId: string,
    batchIndex: number,
    data: RowData[],
    offset: number
  ) => void;
  setSelectedColumns: (datasourceId: string, columns: string[]) => void;
  toggleColumnSelection: (datasourceId: string, columnName: string) => void;
  selectAllColumns: (datasourceId: string) => void;
  clearColumnSelection: (datasourceId: string) => void;
  setLoading: (datasourceId: string, isLoading: boolean) => void;
  setError: (datasourceId: string, error: string | null) => void;
  clearData: (datasourceId: string) => void;
  resetStream: (datasourceId: string) => void;
  getDatasourceState: (datasourceId: string) => DatasourceState | undefined;
}

const getDefaultState = (): DatasourceState => ({
  data: [],
  selectedColumns: [],
  columns: [],
  total: 0,
  isLoading: false,
  loadedBatches: new Set(),
  error: null,
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
          // Initialize data array with nulls for the total size
          data: new Array(total).fill(null),
        },
      },
    }));
  },

  setData: (datasourceId, data) => {
    set((state) => {
      const existing = state.datasources[datasourceId];
      if (!existing) return state;

      return {
        datasources: {
          ...state.datasources,
          [datasourceId]: {
            ...existing,
            data,
          },
        },
      };
    });
  },

  appendBatch: (datasourceId, batchIndex, batchData, offset) => {
    set((state) => {
      const existing = state.datasources[datasourceId];
      if (!existing) return state;

      // Create new data array with batch data inserted
      const newData = [...existing.data];

      // Ensure array is large enough
      while (newData.length < offset + batchData.length) {
        newData.push(null);
      }

      // Insert batch data at the correct offset
      batchData.forEach((row, idx) => {
        newData[offset + idx] = row;
      });

      // Track loaded batch
      const newLoadedBatches = new Set(existing.loadedBatches);
      newLoadedBatches.add(batchIndex);

      return {
        datasources: {
          ...state.datasources,
          [datasourceId]: {
            ...existing,
            data: newData,
            loadedBatches: newLoadedBatches,
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
          [datasourceId]: {
            ...existing,
            selectedColumns: columns,
          },
        },
      };
    });
  },

  toggleColumnSelection: (datasourceId, columnName) => {
    set((state) => {
      const existing = state.datasources[datasourceId];
      if (!existing) return state;

      const isSelected = existing.selectedColumns.includes(columnName);
      const newSelectedColumns = isSelected
        ? existing.selectedColumns.filter((c) => c !== columnName)
        : [...existing.selectedColumns, columnName];

      return {
        datasources: {
          ...state.datasources,
          [datasourceId]: {
            ...existing,
            selectedColumns: newSelectedColumns,
          },
        },
      };
    });
  },

  selectAllColumns: (datasourceId) => {
    set((state) => {
      const existing = state.datasources[datasourceId];
      if (!existing) return state;

      return {
        datasources: {
          ...state.datasources,
          [datasourceId]: {
            ...existing,
            selectedColumns: existing.columns.map((c) => c.name),
          },
        },
      };
    });
  },

  clearColumnSelection: (datasourceId) => {
    set((state) => {
      const existing = state.datasources[datasourceId];
      if (!existing) return state;

      return {
        datasources: {
          ...state.datasources,
          [datasourceId]: {
            ...existing,
            selectedColumns: [],
          },
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
          [datasourceId]: {
            ...existing,
            isLoading,
          },
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
          [datasourceId]: {
            ...existing,
            error,
            isLoading: false,
          },
        },
      };
    });
  },

  clearData: (datasourceId) => {
    set((state) => {
      const { [datasourceId]: _, ...rest } = state.datasources;
      return { datasources: rest };
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
            data: new Array(existing.total).fill(null),
            loadedBatches: new Set(),
            isLoading: false,
            error: null,
          },
        },
      };
    });
  },

  getDatasourceState: (datasourceId) => {
    return get().datasources[datasourceId];
  },
}));

// Stable empty defaults to prevent infinite re-renders
const EMPTY_ARRAY: readonly any[] = [];
const EMPTY_STRING_ARRAY: readonly string[] = [];
const EMPTY_SET: ReadonlySet<number> = new Set();

// Selector hooks for performance optimization
export const useDatasourceData = (datasourceId: string) =>
  useDatasourceStore(
    (state) => state.datasources[datasourceId]?.data ?? EMPTY_ARRAY
  );

export const useDatasourceColumns = (datasourceId: string) =>
  useDatasourceStore(
    (state) => state.datasources[datasourceId]?.columns ?? EMPTY_ARRAY
  );

export const useDatasourceSelectedColumns = (datasourceId: string) =>
  useDatasourceStore(
    (state) =>
      state.datasources[datasourceId]?.selectedColumns ?? EMPTY_STRING_ARRAY
  );

export const useDatasourceTotal = (datasourceId: string) =>
  useDatasourceStore((state) => state.datasources[datasourceId]?.total ?? 0);

export const useDatasourceLoading = (datasourceId: string) =>
  useDatasourceStore(
    (state) => state.datasources[datasourceId]?.isLoading ?? false
  );

export const useDatasourceError = (datasourceId: string) =>
  useDatasourceStore((state) => state.datasources[datasourceId]?.error ?? null);

export const useDatasourceLoadedBatches = (datasourceId: string) =>
  useDatasourceStore(
    (state) => state.datasources[datasourceId]?.loadedBatches ?? EMPTY_SET
  );

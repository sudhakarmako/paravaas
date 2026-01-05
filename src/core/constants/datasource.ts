// Data grid constants
export const DATASOURCE_CONSTANTS = {
  // Batch loading
  BATCH_SIZE: 100,
  MAX_BATCH_SIZE: 50_000,
  DEFAULT_LIMIT: 100,

  // Grid rendering
  ROW_HEIGHT: 32,
  ROW_NUMBER_WIDTH: 60,
  COLUMN_WIDTH: 150,
  OVERSCAN_ROWS: 20,

  // Scroll behavior
  SCROLL_DEBOUNCE_MS: 50,

  // Query caching
  DATA_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  DATA_GC_TIME: 10 * 60 * 1000, // 10 minutes
  METADATA_STALE_TIME: 60 * 1000, // 1 minute
  METADATA_GC_TIME: 5 * 60 * 1000, // 5 minutes
} as const;

export type DatasourceConstants = typeof DATASOURCE_CONSTANTS;

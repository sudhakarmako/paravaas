import { DuckDBInstance, DuckDBConnection } from "@duckdb/node-api";

let instance: DuckDBInstance | null = null;
let connection: DuckDBConnection | null = null;

// Track which views are already created
const activeViews = new Set<string>();

async function getConnection(): Promise<DuckDBConnection> {
  if (!connection) {
    if (!instance) {
      // Use in-memory database
      instance = await DuckDBInstance.create(":memory:");
    }
    connection = await instance.connect();
  }
  return connection;
}

export async function query<T = Record<string, any>>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const conn = await getConnection();
  const result = await conn.runAndReadAll(sql, params);
  return (await result.getRowObjectsJS()) as T[];
}

export async function execute(sql: string, params?: any[]): Promise<void> {
  const conn = await getConnection();
  await conn.run(sql, params);
}

export async function loadCSV(
  tableName: string,
  filePath: string,
  options?: { overwrite?: boolean }
): Promise<void> {
  const conn = await getConnection();
  const escapedPath = filePath.replace(/'/g, "''");

  if (options?.overwrite) {
    await conn.run(`DROP VIEW IF EXISTS ${tableName}`);
    await conn.run(`DROP TABLE IF EXISTS ${tableName}`);
    activeViews.delete(tableName);
  }

  // Create a VIEW instead of a TABLE. 
  // Views in DuckDB are metadata-only and don't load the file into memory 
  // until you actually query it with LIMIT/OFFSET.
  await conn.run(`
    CREATE OR REPLACE VIEW ${tableName} AS 
    SELECT * FROM read_csv_auto('${escapedPath}')
  `);
  
  activeViews.add(tableName);
}

/**
 * Ensure a view exists for the CSV, without loading data into memory.
 */
export async function ensureTableFromCSV(
  tableName: string,
  filePath: string
): Promise<void> {
  if (activeViews.has(tableName)) {
    return;
  }

  const conn = await getConnection();
  const escapedPath = filePath.replace(/'/g, "''");

  // Create or replace view
  await conn.run(`
    CREATE OR REPLACE VIEW ${tableName} AS 
    SELECT * FROM read_csv_auto('${escapedPath}')
  `);

  activeViews.add(tableName);
}

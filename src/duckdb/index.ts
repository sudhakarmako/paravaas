import { DuckDBInstance, DuckDBConnection } from "@duckdb/node-api";
import { existsSync, mkdirSync } from "node:fs";

let instance: DuckDBInstance | null = null;
let connection: DuckDBConnection | null = null;

const DB_PATH = process.env.DUCK_DB_FILE_NAME!;

async function getConnection(): Promise<DuckDBConnection> {
  if (!connection) {
    if (!instance) {
      const dbDir = DB_PATH.substring(0, DB_PATH.lastIndexOf("/"));
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }
      instance = await DuckDBInstance.create(DB_PATH);
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
    await conn.run(`DROP TABLE IF EXISTS ${tableName}`);
  }

  await conn.run(`
    CREATE TABLE IF NOT EXISTS ${tableName} AS 
    SELECT * FROM read_csv_auto('${escapedPath}')
  `);
}

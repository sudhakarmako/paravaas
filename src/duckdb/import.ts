import { loadCSV } from "./index";
import { db } from "@/drizzle";
import { datasourcesTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function importDatasourceToDuckDB(datasourceId: number) {
  try {
    // Get datasource
    const [datasource] = await db
      .select()
      .from(datasourcesTable)
      .where(eq(datasourcesTable.id, datasourceId))
      .limit(1);

    if (!datasource) {
      throw new Error("Datasource not found");
    }

    // Update status to inprogress
    await db
      .update(datasourcesTable)
      .set({ status: "inprogress" })
      .where(eq(datasourcesTable.id, datasourceId));

    // Generate table name: datasource_{id}
    const tableName = `datasource_${datasourceId}`;

    // Import CSV into DuckDB
    await loadCSV(tableName, datasource.filePath, { overwrite: true });

    // Update status to completed with table name
    await db
      .update(datasourcesTable)
      .set({
        status: "completed",
        duckdbTableName: tableName,
      })
      .where(eq(datasourcesTable.id, datasourceId));
  } catch (error) {
    // Update status to failed
    await db
      .update(datasourcesTable)
      .set({ status: "failed" })
      .where(eq(datasourcesTable.id, datasourceId));

    console.error("Failed to import datasource:", error);
    throw error;
  }
}

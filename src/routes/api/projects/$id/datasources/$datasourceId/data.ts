import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/drizzle";
import { datasourcesTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  internalErrorResponse,
} from "@/core/lib/response";
import { query } from "@/duckdb";
import { ZodError, z } from "zod";
import { DATASOURCE_CONSTANTS } from "@/core/constants";

const querySchema = z.object({
  limit: z.coerce
    .number()
    .min(1)
    .max(DATASOURCE_CONSTANTS.MAX_BATCH_SIZE)
    .default(DATASOURCE_CONSTANTS.DEFAULT_LIMIT),
  offset: z.coerce.number().min(0).default(0),
});

export const Route = createFileRoute(
  "/api/projects/$id/datasources/$datasourceId/data"
)({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { id, datasourceId } = params;

        try {
          // Safely parse URL and query parameters
          let limit: number = DATASOURCE_CONSTANTS.DEFAULT_LIMIT;
          let offset = 0;

          try {
            const url = new URL(request.url);
            const queryParams = {
              limit:
                url.searchParams.get("limit") ||
                String(DATASOURCE_CONSTANTS.DEFAULT_LIMIT),
              offset: url.searchParams.get("offset") || "0",
            };
            const parsed = querySchema.parse(queryParams);
            limit = parsed.limit;
            offset = parsed.offset;
          } catch (urlError) {
            console.warn(
              "Failed to parse URL or query params, using defaults:",
              urlError
            );
          }

          // Get datasource
          const [datasource] = await db
            .select()
            .from(datasourcesTable)
            .where(eq(datasourcesTable.id, parseInt(datasourceId)))
            .limit(1);

          if (!datasource) {
            return notFoundResponse("Datasource not found");
          }

          // Verify it belongs to the project
          if (datasource.projectId !== parseInt(id)) {
            return notFoundResponse("Datasource not found");
          }

          // Check if datasource is ready
          if (
            datasource.status !== "completed" ||
            !datasource.duckdbTableName
          ) {
            return badRequestResponse(
              "Datasource is not ready. Status: " + datasource.status
            );
          }

          // Validate table name
          const tableName = datasource.duckdbTableName;
          if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            console.error("Invalid table name format:", tableName);
            return badRequestResponse("Invalid table name format");
          }

          // Get column information by inferring from first row
          let columns: Array<{ column_name: string; column_type: string }> = [];

          try {
            // Get first row to infer column names
            const firstRow = await query(`SELECT * FROM ${tableName} LIMIT 1`);

            if (firstRow.length > 0) {
              // Extract column names from the first row
              columns = Object.keys(firstRow[0]).map((key) => ({
                column_name: key,
                column_type: "VARCHAR",
              }));
            } else {
              // Table exists but is empty - try to get column info from schema
              try {
                const describeResult = await query(`DESCRIBE ${tableName}`);
                if (describeResult && describeResult.length > 0) {
                  // Handle various DESCRIBE output formats
                  const firstDescRow = describeResult[0] as any;
                  const keys = Object.keys(firstDescRow);

                  // Find column name and type keys
                  const nameKey = keys.find(
                    (k) =>
                      ["column_name", "name", "field", "Column"].includes(k) ||
                      k.toLowerCase().includes("name")
                  );
                  const typeKey = keys.find(
                    (k) =>
                      ["column_type", "type", "data_type", "Type"].includes(
                        k
                      ) || k.toLowerCase().includes("type")
                  );

                  columns = describeResult.map((col: any) => ({
                    column_name: nameKey ? col[nameKey] : col[keys[0]] || "",
                    column_type: typeKey ? col[typeKey] : "VARCHAR",
                  }));
                }
              } catch (describeError) {
                console.warn("DESCRIBE failed:", describeError);
              }
            }
          } catch (error) {
            console.error("Failed to get column information:", error);
            throw new Error(
              `Could not determine table columns: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }

          // Handle empty table case - return empty data with columns if we have them
          if (columns.length === 0) {
            // Return empty response for truly empty tables
            return successResponse({
              columns: [],
              data: [],
              pagination: {
                limit,
                offset,
                total: 0,
                hasMore: false,
              },
            });
          }

          // Helper function to convert BigInt and other non-serializable values
          const serializeValue = (value: any): any => {
            if (typeof value === "bigint") {
              // Convert BigInt to string to avoid serialization issues
              return value.toString();
            }
            if (value === null || value === undefined) {
              return null;
            }
            if (typeof value === "object" && value.constructor === Object) {
              // Recursively handle objects
              const result: Record<string, any> = {};
              for (const [key, val] of Object.entries(value)) {
                result[key] = serializeValue(val);
              }
              return result;
            }
            return value;
          };

          // Get data
          let data: Record<string, any>[] = [];
          try {
            const rawData = await query(
              `SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`
            );
            // Serialize BigInt values to strings
            data = rawData.map((row) => {
              const serializedRow: Record<string, any> = {};
              for (const [key, value] of Object.entries(row)) {
                serializedRow[key] = serializeValue(value);
              }
              return serializedRow;
            });
          } catch (queryError) {
            console.error("Failed to query data:", queryError);
            throw new Error(
              `Failed to query table data: ${
                queryError instanceof Error
                  ? queryError.message
                  : String(queryError)
              }`
            );
          }

          // Get total count
          let total = 0;
          try {
            const countResult = await query<{ count: number | bigint }>(
              `SELECT COUNT(*) as count FROM ${tableName}`
            );
            const countValue = countResult[0]?.count;
            if (typeof countValue === "bigint") {
              total = Number(countValue);
            } else {
              total = countValue || 0;
            }
          } catch (countError) {
            console.error("Failed to get count:", countError);
            total = data.length;
          }

          const response = {
            columns: columns.map((col) => ({
              name: col.column_name,
              type: col.column_type,
            })),
            data,
            pagination: {
              limit,
              offset,
              total,
              hasMore: offset + limit < total,
            },
          };

          return successResponse(response);
        } catch (error) {
          if (error instanceof ZodError) {
            const errorMessage = error.issues.map((e) => e.message).join(", ");
            return badRequestResponse(errorMessage);
          }

          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error("Data fetch error:", {
            error: errorMessage,
            datasourceId: params?.datasourceId || "unknown",
            projectId: params?.id || "unknown",
            stack: error instanceof Error ? error.stack : undefined,
          });

          return internalErrorResponse(
            `Failed to fetch datasource data: ${errorMessage}`
          );
        }
      },
    },
  },
});

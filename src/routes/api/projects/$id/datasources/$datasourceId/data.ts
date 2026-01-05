import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/drizzle";
import { datasourcesTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  notFoundResponse,
  badRequestResponse,
  internalErrorResponse,
  successResponse,
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
  stream: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
});

// Helper function to convert BigInt and other non-serializable values
const serializeValue = (value: any): any => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "object" && value.constructor === Object) {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeValue(val);
    }
    return result;
  }
  return value;
};

// Get column information from table
async function getTableColumns(tableName: string) {
  let columns: Array<{ column_name: string; column_type: string }> = [];

  const firstRow = await query(`SELECT * FROM ${tableName} LIMIT 1`);

  if (firstRow.length > 0) {
    columns = Object.keys(firstRow[0]).map((key) => ({
      column_name: key,
      column_type: "VARCHAR",
    }));
  } else {
    try {
      const describeResult = await query(`DESCRIBE ${tableName}`);
      if (describeResult && describeResult.length > 0) {
        const firstDescRow = describeResult[0] as any;
        const keys = Object.keys(firstDescRow);

        const nameKey = keys.find(
          (k) =>
            ["column_name", "name", "field", "Column"].includes(k) ||
            k.toLowerCase().includes("name")
        );
        const typeKey = keys.find(
          (k) =>
            ["column_type", "type", "data_type", "Type"].includes(k) ||
            k.toLowerCase().includes("type")
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

  return columns;
}

// Get total count from table
async function getTableCount(tableName: string): Promise<number> {
  const countResult = await query<{ count: number | bigint }>(
    `SELECT COUNT(*) as count FROM ${tableName}`
  );
  const countValue = countResult[0]?.count;
  if (typeof countValue === "bigint") {
    return Number(countValue);
  }
  return countValue || 0;
}

export const Route = createFileRoute(
  "/api/projects/$id/datasources/$datasourceId/data"
)({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { id, datasourceId } = params;

        try {
          // Parse URL and query parameters
          const url = new URL(request.url);
          const queryParams = {
            limit:
              url.searchParams.get("limit") ||
              String(DATASOURCE_CONSTANTS.DEFAULT_LIMIT),
            offset: url.searchParams.get("offset") || "0",
            stream: url.searchParams.get("stream") || "false",
          };

          const parsed = querySchema.parse(queryParams);
          const { limit, offset, stream } = parsed;

          // Get datasource
          const [datasource] = await db
            .select()
            .from(datasourcesTable)
            .where(eq(datasourcesTable.id, parseInt(datasourceId)))
            .limit(1);

          if (!datasource) {
            return notFoundResponse("Datasource not found");
          }

          if (datasource.projectId !== parseInt(id)) {
            return notFoundResponse("Datasource not found");
          }

          if (
            datasource.status !== "completed" ||
            !datasource.duckdbTableName
          ) {
            return badRequestResponse(
              "Datasource is not ready. Status: " + datasource.status
            );
          }

          const tableName = datasource.duckdbTableName;
          if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            console.error("Invalid table name format:", tableName);
            return badRequestResponse("Invalid table name format");
          }

          // Get columns and total count
          const columns = await getTableColumns(tableName);
          const total = await getTableCount(tableName);

          if (columns.length === 0) {
            return successResponse({
              columns: [],
              data: [],
              pagination: { limit, offset, total: 0, hasMore: false },
            });
          }

          // If streaming is requested, return NDJSON stream
          if (stream) {
            const encoder = new TextEncoder();
            const batchSize = DATASOURCE_CONSTANTS.BATCH_SIZE;

            const readableStream = new ReadableStream({
              async start(controller) {
                try {
                  // Send metadata as first line
                  const metadata = {
                    type: "metadata",
                    columns: columns.map((col) => ({
                      name: col.column_name,
                      type: col.column_type,
                    })),
                    total,
                    batchSize,
                  };
                  controller.enqueue(
                    encoder.encode(JSON.stringify(metadata) + "\n")
                  );

                  // Stream data in batches
                  let currentOffset = offset;
                  let remaining = limit;

                  while (remaining > 0 && currentOffset < total) {
                    const batchLimit = Math.min(batchSize, remaining);

                    const rawData = await query(
                      `SELECT * FROM ${tableName} LIMIT ${batchLimit} OFFSET ${currentOffset}`
                    );

                    if (rawData.length === 0) break;

                    const serializedData = rawData.map((row) => {
                      const serializedRow: Record<string, any> = {};
                      for (const [key, value] of Object.entries(row)) {
                        serializedRow[key] = serializeValue(value);
                      }
                      return serializedRow;
                    });

                    // Send batch as a single line
                    const batch = {
                      type: "batch",
                      offset: currentOffset,
                      data: serializedData,
                    };
                    controller.enqueue(
                      encoder.encode(JSON.stringify(batch) + "\n")
                    );

                    currentOffset += rawData.length;
                    remaining -= rawData.length;
                  }

                  // Send completion message
                  const complete = {
                    type: "complete",
                    totalLoaded: currentOffset - offset,
                  };
                  controller.enqueue(
                    encoder.encode(JSON.stringify(complete) + "\n")
                  );

                  controller.close();
                } catch (error) {
                  const errorMessage =
                    error instanceof Error ? error.message : String(error);
                  const errorPayload = { type: "error", error: errorMessage };
                  controller.enqueue(
                    encoder.encode(JSON.stringify(errorPayload) + "\n")
                  );
                  controller.close();
                }
              },
            });

            return new Response(readableStream, {
              headers: {
                "Content-Type": "application/x-ndjson",
                "Transfer-Encoding": "chunked",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            });
          }

          // Non-streaming: return regular JSON response
          const rawData = await query(
            `SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`
          );

          const data = rawData.map((row) => {
            const serializedRow: Record<string, any> = {};
            for (const [key, value] of Object.entries(row)) {
              serializedRow[key] = serializeValue(value);
            }
            return serializedRow;
          });

          // Return data directly without wrapper to match DatasourceDataResponse type
          return successResponse({
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
          });
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

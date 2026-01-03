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
import { ZodError, z } from "zod";

const datasourceIdSchema = z.coerce.number();

export const Route = createFileRoute(
  "/api/projects/$id/datasources/$datasourceId"
)({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { id, datasourceId } = params;
          const parsedId = datasourceIdSchema.parse(id);
          const parsedDatasourceId = datasourceIdSchema.parse(datasourceId);

          // Get datasource
          const [datasource] = await db
            .select()
            .from(datasourcesTable)
            .where(eq(datasourcesTable.id, parsedDatasourceId))
            .limit(1);

          if (!datasource) {
            return notFoundResponse("Datasource not found");
          }

          // Verify it belongs to the project
          if (datasource.projectId !== parsedId) {
            return notFoundResponse("Datasource not found");
          }

          return successResponse({ datasource });
        } catch (error) {
          if (error instanceof ZodError) {
            const errorMessage = error.issues.map((e) => e.message).join(", ");
            return badRequestResponse(errorMessage);
          }

          return internalErrorResponse("Failed to fetch datasource");
        }
      },
    },
  },
});


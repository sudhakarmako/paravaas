import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/drizzle";
import { projectsTable, datasourcesTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  internalErrorResponse,
} from "@/core/lib/response";
import { projectIdSchema, updateProjectSchema } from "@/core/types/projects";
import { ZodError } from "zod";
import { unlink } from "fs/promises";
import { existsSync } from "fs";

export const Route = createFileRoute("/api/projects/$id")({
  server: {
    handlers: {
      // GET - Get a single project by ID
      GET: async ({ params }) => {
        try {
          const id = projectIdSchema.parse(params.id);

          const [project] = await db
            .select()
            .from(projectsTable)
            .where(eq(projectsTable.id, id))
            .limit(1);

          if (!project) {
            return notFoundResponse("Project not found");
          }

          return successResponse({ project });
        } catch (error) {
          if (error instanceof ZodError) {
            const errorMessage = error.issues.map((e) => e.message).join(", ");
            return badRequestResponse(errorMessage);
          }

          return internalErrorResponse("Failed to fetch project");
        }
      },
      // PUT - Update a project
      PUT: async ({ params, request }) => {
        try {
          const id = projectIdSchema.parse(params.id);
          const body = await request.json();
          const data = updateProjectSchema.parse(body);

          const updateData: Record<string, unknown> = {};
          if (data.name !== undefined) updateData.name = data.name;
          if (data.icon !== undefined) updateData.icon = data.icon || null;
          if (data.color !== undefined) updateData.color = data.color || null;
          if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;

          const [project] = await db
            .update(projectsTable)
            .set(updateData)
            .where(eq(projectsTable.id, id))
            .returning();

          if (!project) {
            return notFoundResponse("Project not found");
          }

          return successResponse({ project });
        } catch (error) {
          if (error instanceof ZodError) {
            const errorMessage = error.issues.map((e) => e.message).join(", ");
            return badRequestResponse(errorMessage);
          }

          return internalErrorResponse("Failed to update project");
        }
      },
      // PATCH - Toggle pin status
      PATCH: async ({ params, request }) => {
        try {
          const id = projectIdSchema.parse(params.id);
          const body = await request.json();
          const { isPinned } = body;

          if (typeof isPinned !== "boolean") {
            return badRequestResponse("isPinned must be a boolean");
          }

          const [project] = await db
            .update(projectsTable)
            .set({ isPinned })
            .where(eq(projectsTable.id, id))
            .returning();

          if (!project) {
            return notFoundResponse("Project not found");
          }

          return successResponse({ project });
        } catch (error) {
          if (error instanceof ZodError) {
            const errorMessage = error.issues.map((e) => e.message).join(", ");
            return badRequestResponse(errorMessage);
          }

          return internalErrorResponse("Failed to toggle pin status");
        }
      },
      // DELETE - Delete a project
      DELETE: async ({ params }) => {
        try {
          const id = projectIdSchema.parse(params.id);

          // Verify project exists
          const [project] = await db
            .select()
            .from(projectsTable)
            .where(eq(projectsTable.id, id))
            .limit(1);

          if (!project) {
            return notFoundResponse("Project not found");
          }

          // Fetch all datasources for this project
          const datasources = await db
            .select()
            .from(datasourcesTable)
            .where(eq(datasourcesTable.projectId, id));

          // Delete all datasource files from disk
          for (const datasource of datasources) {
            try {
              if (datasource.filePath && existsSync(datasource.filePath)) {
                await unlink(datasource.filePath);
              }
            } catch (fileError) {
              // Log error but continue with deletion
              // File might already be deleted or not exist
              console.error(
                `Failed to delete file ${datasource.filePath}:`,
                fileError
              );
            }
          }

          // Delete the project (this will cascade delete datasource records)
          await db.delete(projectsTable).where(eq(projectsTable.id, id));

          return successResponse({
            message: "Project deleted successfully",
            project,
          });
        } catch (error) {
          if (error instanceof ZodError) {
            const errorMessage = error.issues.map((e) => e.message).join(", ");
            return badRequestResponse(errorMessage);
          }

          return internalErrorResponse("Failed to delete project");
        }
      },
    },
  },
});

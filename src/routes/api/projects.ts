import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/drizzle";
import { projectsTable } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import {
  successResponse,
  createdResponse,
  badRequestResponse,
  internalErrorResponse,
} from "@/core/lib/response";
import { createProjectSchema } from "@/core/types/projects";
import { ZodError } from "zod";

export const Route = createFileRoute("/api/projects")({
  server: {
    handlers: {
      // GET - List all projects
      GET: async () => {
        try {
          const projects = await db
            .select()
            .from(projectsTable)
            .orderBy(desc(projectsTable.isPinned), desc(projectsTable.id));
          return successResponse({ projects });
        } catch (error) {
          return internalErrorResponse("Failed to fetch projects");
        }
      },
      // POST - Create a new project
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { name, icon, color } = createProjectSchema.parse(body);

          const [project] = await db
            .insert(projectsTable)
            .values({
              name,
              icon: icon || null,
              color: color || null,
              createdAt: Date.now(),
              isPinned: false,
            })
            .returning();

          return createdResponse({ project });
        } catch (error) {
          if (error instanceof ZodError) {
            const errorMessage = error.issues.map((e) => e.message).join(", ");
            return badRequestResponse(errorMessage);
          }

          return internalErrorResponse("Failed to create project");
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/drizzle";
import { projectsTable, datasourcesTable } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import {
  successResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse,
  internalErrorResponse,
} from "@/core/lib/response";
import { projectIdSchema } from "@/core/types/projects";
import { ZodError } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = join(process.cwd(), "uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export const Route = createFileRoute("/api/projects/$id/datasources")({
  server: {
    handlers: {
      // GET - List all datasources for a project
      GET: async ({ params }) => {
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

          const datasources = await db
            .select()
            .from(datasourcesTable)
            .where(eq(datasourcesTable.projectId, id))
            .orderBy(
              desc(datasourcesTable.uploadedAt),
              desc(datasourcesTable.id)
            );

          return successResponse({ datasources });
        } catch (error) {
          if (error instanceof ZodError) {
            const errorMessage = error.issues.map((e) => e.message).join(", ");
            return badRequestResponse(errorMessage);
          }

          return internalErrorResponse("Failed to fetch datasources");
        }
      },
      // POST - Upload a CSV file
      POST: async ({ request, params }) => {
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

          const formData = await request.formData();
          const file = formData.get("file") as File;

          if (!file) {
            return badRequestResponse("No file provided");
          }

          // Validate file type
          if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            return badRequestResponse("Only CSV files are allowed");
          }

          // Ensure upload directory exists
          await ensureUploadDir();

          // Generate unique filename
          const timestamp = Date.now();
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const fileName = `${timestamp}_${sanitizedFileName}`;
          const filePath = join(UPLOAD_DIR, fileName);

          // Save file to disk
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          await writeFile(filePath, buffer);

          // Save metadata to database
          const [datasource] = await db
            .insert(datasourcesTable)
            .values({
              projectId: id,
              fileName: file.name,
              filePath: filePath,
              fileSize: file.size,
              mimeType: file.type || "text/csv",
              uploadedAt: Date.now(),
            })
            .returning();

          return createdResponse({ datasource });
        } catch (error) {
          if (error instanceof ZodError) {
            const errorMessage = error.issues.map((e) => e.message).join(", ");
            return badRequestResponse(errorMessage);
          }

          console.error("Upload error:", error);
          return internalErrorResponse("Failed to upload file");
        }
      },
    },
  },
});

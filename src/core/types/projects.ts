import { z } from "zod";

/**
 * Zod schema for project ID parameter
 */
export const projectIdSchema = z.string().transform((val) => {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) {
    throw new Error("Invalid project ID");
  }
  return parsed;
});

/**
 * Zod schema for creating a project
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required and must be a non-empty string")
    .trim(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

/**
 * Zod schema for updating a project
 */
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required and must be a non-empty string")
    .trim()
    .optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isPinned: z.boolean().optional(),
});

/**
 * Zod schema for project (database entity)
 */
export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.number(),
  isPinned: z.boolean(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
});

/**
 * TypeScript types inferred from Zod schemas
 */
export type ProjectId = z.infer<typeof projectIdSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type Project = z.infer<typeof projectSchema>;

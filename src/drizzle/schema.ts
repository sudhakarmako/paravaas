import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("user", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  age: int().notNull(),
  email: text().notNull().unique(),
});

export const projectsTable = sqliteTable("project", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  createdAt: int("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  isPinned: int("is_pinned", { mode: "boolean" }).notNull().default(false),
  icon: text("icon"),
  color: text("color"),
});

export const datasourcesTable = sqliteTable("datasource", {
  id: int().primaryKey({ autoIncrement: true }),
  projectId: int("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: int("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedAt: int("uploaded_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

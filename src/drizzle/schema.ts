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

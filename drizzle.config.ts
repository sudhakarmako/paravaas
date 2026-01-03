import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/drizzle/migrations",
  schema: "./src/drizzle/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_FILE_NAME!,
  },
});

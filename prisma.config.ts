import { defineConfig, env } from "prisma/config";
import dotenv from "dotenv";

// Load .env when running prisma CLI so env("DATABASE_URL") is available
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

import { defineConfig, env } from "prisma/config";

// Note: Removed dotenv for production compatibility.
// Prisma CLI automatically loads .env in dev, and Docker provides env vars in production.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL") || process.env.DATABASE_URL,
  },
});

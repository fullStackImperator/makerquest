import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

/**
 * Separate Prisma config for the legacy makerspace schema only.
 * Paths are relative to this file.
 */
export default defineConfig({
  schema: "./schema.prisma",
  datasource: {
    // Generate does not connect; migrate script passes URL at runtime via PrismaClient.
    url: process.env.OLD_DATABASE_URL ?? "postgresql://127.0.0.1:5432/placeholder",
  },
});

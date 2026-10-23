import "server-only";
import { PrismaClient } from "@prisma/client";

const datasourceUrl = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL)
  : undefined;

if (datasourceUrl?.hostname.endsWith(".neon.tech")) {
  datasourceUrl.searchParams.set(
    "connect_timeout",
    datasourceUrl.searchParams.get("connect_timeout") ?? "30",
  );
  datasourceUrl.searchParams.set(
    "pool_timeout",
    datasourceUrl.searchParams.get("pool_timeout") ?? "30",
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl
      ? { datasources: { db: { url: datasourceUrl.toString() } } }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

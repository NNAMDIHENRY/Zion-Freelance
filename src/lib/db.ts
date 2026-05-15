import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public";

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: ["error", "warn"]
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

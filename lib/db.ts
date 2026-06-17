import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  prismaSchemaHash?: string;
};

/** Bust cached client in dev after `prisma generate` adds schema fields. */
const PRISMA_SCHEMA_HASH = "user-locale-v1";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
  });
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  if (process.env.NODE_ENV === "production") {
    globalForPrisma.prisma ??= createPrismaClient();
    return globalForPrisma.prisma;
  }

  if (
    !globalForPrisma.prisma ||
    globalForPrisma.prismaSchemaHash !== PRISMA_SCHEMA_HASH
  ) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaSchemaHash = PRISMA_SCHEMA_HASH;
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

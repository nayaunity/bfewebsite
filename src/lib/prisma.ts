import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  // Use Turso in production with libsql:// or https:// URL
  if (url && (url.startsWith("libsql://") || url.startsWith("https://"))) {
    // Ensure URL doesn't have trailing slash
    const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    const adapter = new PrismaLibSQL({ url: cleanUrl, authToken });
    return new PrismaClient({ adapter });
  }

  // Local SQLite for development
  return new PrismaClient();
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

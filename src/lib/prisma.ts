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
    // Ensure URL doesn't have trailing slash or whitespace
    const cleanUrl = url.trim().replace(/\/+$/, "");
    const adapter = new PrismaLibSQL({ url: cleanUrl, authToken: authToken || undefined });
    return new PrismaClient({ adapter });
  }

  // Local SQLite for development
  return new PrismaClient();
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

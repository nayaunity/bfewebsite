import "server-only";
import { prisma } from "./prisma";

export async function logError({
  userId,
  endpoint,
  method,
  status,
  error,
  detail,
  userAgent,
}: {
  userId?: string | null;
  endpoint: string;
  method?: string;
  status?: number;
  error: string;
  detail?: string;
  userAgent?: string;
}) {
  try {
    await prisma.errorLog.create({
      data: {
        userId: userId || null,
        endpoint,
        method: method || "UNKNOWN",
        status: status || 500,
        error: error.slice(0, 500),
        detail: detail?.slice(0, 2000) || null,
        userAgent: userAgent?.slice(0, 500) || null,
      },
    });
  } catch {
    // Don't let error logging break the request
    console.error("Failed to log error:", { endpoint, error });
  }
}

import "server-only";

import { prisma } from "@/lib/prisma";

const REQUIRED_REFERRAL_TABLES = [
  "LinkedInConnection",
  "LinkedInSyncRun",
  "ReferralRequest",
  "ReferralRequestEvent",
] as const;

export const REFERRAL_BACKEND_UNAVAILABLE_MESSAGE =
  "Referral Assist is still being provisioned in production. Please try again in a few minutes.";

type SqliteTableRow = {
  name: string;
};

export function isReferralBackendUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /P2021|P2022|no such table|does not exist|not found/i.test(message);
}

export async function getReferralBackendStatus(): Promise<{
  ready: boolean;
  missingTables: string[];
  message: string | null;
}> {
  try {
    const rows = await prisma.$queryRawUnsafe<SqliteTableRow[]>(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${REQUIRED_REFERRAL_TABLES.map((table) => `'${table}'`).join(", ")})`
    );

    const found = new Set(rows.map((row) => row.name));
    const missingTables = REQUIRED_REFERRAL_TABLES.filter((table) => !found.has(table));

    return {
      ready: missingTables.length === 0,
      missingTables,
      message:
        missingTables.length === 0
          ? null
          : REFERRAL_BACKEND_UNAVAILABLE_MESSAGE,
    };
  } catch (error) {
    if (isReferralBackendUnavailableError(error)) {
      return {
        ready: false,
        missingTables: [...REQUIRED_REFERRAL_TABLES],
        message: REFERRAL_BACKEND_UNAVAILABLE_MESSAGE,
      };
    }

    throw error;
  }
}

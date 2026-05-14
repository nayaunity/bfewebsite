import { createHmac, timingSafeEqual } from "node:crypto";

export const LINKEDIN_SYNC_TOKEN_TTL_MS = 10 * 60 * 1000;

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createLinkedInSyncToken(
  params: { userId: string; origin: string; ttlMs?: number },
  secret: string
): { token: string; expiresAt: string } {
  const expiresAt = new Date(Date.now() + (params.ttlMs ?? LINKEDIN_SYNC_TOKEN_TTL_MS)).toISOString();
  const payload = encodeBase64Url(JSON.stringify({
    kind: "linkedin-sync",
    userId: params.userId,
    origin: params.origin,
    exp: expiresAt,
  }));
  const signature = signValue(payload, secret);
  return {
    token: `${payload}.${signature}`,
    expiresAt,
  };
}

export function verifyLinkedInSyncToken(
  token: string,
  secret: string
): { userId: string; origin: string; expiresAt: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = signValue(payload, secret);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as {
      kind?: string;
      userId?: string;
      origin?: string;
      exp?: string;
    };
    if (parsed.kind !== "linkedin-sync" || !parsed.userId || !parsed.origin || !parsed.exp) {
      return null;
    }
    if (new Date(parsed.exp).getTime() <= Date.now()) {
      return null;
    }
    return {
      userId: parsed.userId,
      origin: parsed.origin,
      expiresAt: parsed.exp,
    };
  } catch {
    return null;
  }
}

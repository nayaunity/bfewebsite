/**
 * Per-(user, Workday tenant) credential store. The Workday handler auto-creates
 * an account at first apply using `applicationEmail` + a generated password,
 * stores the password encrypted, and reuses it on subsequent applies.
 *
 * Encryption: AES-256-GCM. Master key from `WORKDAY_CREDENTIAL_KEY` env (32-byte
 * hex string, 64 chars). Generate once via:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * Then add to Vercel + Railway env. Treat as a long-lived secret; rotation
 * requires re-encrypting all rows (not implemented here, defer until needed).
 *
 * Wire format: base64(iv || authTag || ciphertext) — single string column.
 *   - iv:        12 bytes (GCM standard)
 *   - authTag:   16 bytes
 *   - ciphertext: variable length (matches plaintext length)
 */

import { randomBytes, createCipheriv, createDecipheriv, randomInt } from "crypto";
import { getDb } from "../db";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

function getMasterKey(): Buffer {
  const hex = process.env.WORKDAY_CREDENTIAL_KEY;
  if (!hex) {
    throw new Error(
      "WORKDAY_CREDENTIAL_KEY env var is not set. Generate with `node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"` and add to Vercel + Railway env."
    );
  }
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("WORKDAY_CREDENTIAL_KEY must be 64 hex characters (32 bytes).");
  }
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== KEY_BYTES) {
    throw new Error(`WORKDAY_CREDENTIAL_KEY decoded to ${buf.length} bytes, expected ${KEY_BYTES}.`);
  }
  return buf;
}

export function encryptPassword(plaintext: string): string {
  const key = getMasterKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  if (authTag.length !== TAG_BYTES) {
    throw new Error(`Unexpected GCM auth tag length: ${authTag.length}`);
  }
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptPassword(stored: string): string {
  const key = getMasterKey();
  const buf = Buffer.from(stored, "base64");
  if (buf.length < IV_BYTES + TAG_BYTES + 1) {
    throw new Error("Encrypted password too short to be valid.");
  }
  const iv = buf.subarray(0, IV_BYTES);
  const authTag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

/**
 * Generate a Workday-acceptable password. Workday's stated policy across
 * tenants we've seen: 8-32 chars, at least one upper, lower, digit, special.
 * We generate 20 chars from a pool that satisfies all four classes
 * unconditionally to avoid retry loops on weak randoms.
 */
export function generateWorkdayPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";  // skip I/O for human-readability if seen in logs
  const lower = "abcdefghijkmnpqrstuvwxyz";   // skip l/o
  const digits = "23456789";                   // skip 0/1
  const special = "!@#$%&*+-_";
  const all = upper + lower + digits + special;

  const required = [
    upper[randomInt(0, upper.length)],
    lower[randomInt(0, lower.length)],
    digits[randomInt(0, digits.length)],
    special[randomInt(0, special.length)],
  ];
  const rest: string[] = [];
  for (let i = 0; i < 16; i++) {
    rest.push(all[randomInt(0, all.length)]);
  }
  // Shuffle so the required-class chars aren't always at the start
  const out = required.concat(rest);
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
}

export interface WorkdayCredential {
  email: string;
  password: string;
  isNew: boolean;
}

/**
 * Look up an existing credential for (userId, tenantHost). If none exists,
 * generate a fresh password, encrypt it, persist a new row, and return the
 * cleartext password to the caller for use during account creation.
 *
 * The caller is responsible for actually creating the account on Workday.
 * If account creation fails after we've persisted, we leak a row but the
 * row is harmless (the password just won't match anything). Cheaper than
 * coordinating a rollback.
 */
export async function getOrCreateCredential(
  userId: string,
  tenantHost: string,
  applicationEmail: string,
): Promise<WorkdayCredential> {
  const db = getDb();
  const existing = await db.execute({
    sql: `SELECT email, passwordEncrypted FROM WorkdayCredential WHERE userId = ? AND tenantHost = ? LIMIT 1`,
    args: [userId, tenantHost],
  });
  if (existing.rows.length > 0) {
    const row = existing.rows[0] as unknown as { email: string; passwordEncrypted: string };
    return { email: row.email, password: decryptPassword(row.passwordEncrypted), isNew: false };
  }

  const password = generateWorkdayPassword();
  const encrypted = encryptPassword(password);
  const id = `wcd_${randomBytes(12).toString("base64url")}`;
  await db.execute({
    sql: `INSERT INTO WorkdayCredential (id, userId, tenantHost, email, passwordEncrypted, createdAt) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    args: [id, userId, tenantHost, applicationEmail, encrypted],
  });
  return { email: applicationEmail, password, isNew: true };
}

export async function markCredentialUsed(userId: string, tenantHost: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `UPDATE WorkdayCredential SET lastUsedAt = datetime('now') WHERE userId = ? AND tenantHost = ?`,
    args: [userId, tenantHost],
  });
}

import { getDb } from "./db";
import { discoverJobs, applyToJob } from "./career-browser";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import targetCompanies from "../data/target-companies.json";

const DELAY_BETWEEN_COMPANIES_MS = 10_000;
const DELAY_BETWEEN_JOBS_MS = 5_000;
const COMPANY_TIMEOUT_MS = 120_000;

function log(sessionId: string, level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), sessionId, level, msg, ...meta }));
}

interface BrowseSessionRow {
  id: string;
  userId: string;
  targetRole: string;
  companies: string;
  resumeUrl: string;
  resumeName: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  applicationEmail: string | null;
  phone: string;
  preferredName: string | null;
  pronouns: string | null;
  usState: string | null;
  workAuthorized: number | null;
  needsSponsorship: number | null;
  countryOfResidence: string | null;
  willingToRelocate: number | null;
  remotePreference: string | null;
  monthlyAppCount: number;
  subscriptionTier: string;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  currentEmployer: string | null;
  currentTitle: string | null;
  school: string | null;
  degree: string | null;
  graduationYear: string | null;
  additionalCerts: string | null;
  city: string | null;
  yearsOfExperience: string | null;
  salaryExpectation: string | null;
  earliestStartDate: string | null;
  gender: string | null;
  race: string | null;
  hispanicOrLatino: string | null;
  veteranStatus: string | null;
  disabilityStatus: string | null;
  applicationAnswers: string | null;
}

const companyUrlMap = new Map(
  targetCompanies.map((c) => [c.name, c.careersUrl])
);

/**
 * Poll for and process the next browse session.
 */
export async function processNextBrowseSession(): Promise<boolean> {
  const db = getDb();

  // Watchdog: reset sessions stuck in "processing" for >30 minutes
  try {
    const stale = await db.execute({
      sql: `UPDATE BrowseSession SET status = 'failed',
            errorMessage = 'Session timed out — please try again',
            completedAt = datetime('now')
            WHERE status = 'processing'
            AND startedAt < datetime('now', '-30 minutes')
            RETURNING id`,
      args: [],
    });
    if (stale.rows && stale.rows.length > 0) {
      for (const row of stale.rows) {
        console.log(JSON.stringify({ ts: new Date().toISOString(), level: "warn", msg: "Reset stuck session", sessionId: row.id }));
      }
    }
  } catch {}

  // Atomically claim next queued session
  const result = await db.execute({
    sql: `UPDATE BrowseSession SET status = 'processing', startedAt = datetime('now')
          WHERE id = (SELECT id FROM BrowseSession WHERE status = 'queued' ORDER BY createdAt ASC LIMIT 1)
          RETURNING id, userId, targetRole, companies, resumeUrl, resumeName`,
    args: [],
  });

  if (!result.rows || result.rows.length === 0) {
    return false;
  }

  const session = result.rows[0] as unknown as BrowseSessionRow;
  log(session.id, "info", `Processing session for role: ${session.targetRole}`, { userId: session.userId });

  // Fetch user profile
  const userResult = await db.execute({
    sql: `SELECT firstName, lastName, email, applicationEmail, phone, preferredName, pronouns, usState, workAuthorized, needsSponsorship, countryOfResidence, willingToRelocate, remotePreference, monthlyAppCount, subscriptionTier, linkedinUrl, githubUrl, websiteUrl, currentEmployer, currentTitle, school, degree, graduationYear, additionalCerts, city, yearsOfExperience, salaryExpectation, earliestStartDate, gender, race, hispanicOrLatino, veteranStatus, disabilityStatus, applicationAnswers FROM User WHERE id = ?`,
    args: [session.userId],
  });

  if (!userResult.rows || userResult.rows.length === 0) {
    await markSessionFailed(session.id, "User not found");
    return true;
  }

  const user = userResult.rows[0] as unknown as UserProfile;
  const companies: string[] = JSON.parse(session.companies);

  // Download resume once for the whole session
  let resumePath: string | null = null;
  try {
    resumePath = join(tmpdir(), `resume-${Date.now()}.pdf`);
    const res = await fetch(session.resumeUrl);
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(resumePath, buffer);
  } catch (err) {
    await markSessionFailed(session.id, "Failed to download resume");
    return true;
  }

  // Process each company
  let limitReached = false;
  for (const companyName of companies) {
    // Stop early if monthly limit was already hit
    if (limitReached) {
      await appendProgressLog(session.id, {
        company: companyName,
        status: "skipped",
        found: 0,
        applied: 0,
        skipped: 0,
        failed: 0,
        error: "Monthly limit reached — stopping session",
      });
      await incrementCompanyDone(session.id);
      continue;
    }
    const careersUrl = companyUrlMap.get(companyName);
    if (!careersUrl) {
      await appendProgressLog(session.id, {
        company: companyName,
        status: "error",
        error: "No career page URL configured",
        found: 0,
        applied: 0,
      });
      await incrementCompanyDone(session.id);
      continue;
    }

    const companyResult = { found: 0, applied: 0, skipped: 0, failed: 0 };

    try {
      // Apply company timeout
      const { jobs: discovered, log: discoveryLog } = await Promise.race([
        discoverJobs(careersUrl, session.targetRole),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Company timeout")), COMPANY_TIMEOUT_MS)
        ),
      ]);

      companyResult.found = discovered.length;
      console.log(`[Browse] ${companyName}: found ${discovered.length} matching jobs`);
      for (const step of discoveryLog.steps) {
        console.log(`[Browse] ${companyName}: ${step}`);
      }

      // Update session counters
      await db.execute({
        sql: `UPDATE BrowseSession SET jobsFound = jobsFound + ? WHERE id = ?`,
        args: [discovered.length, session.id],
      });

      // Apply to each discovered job
      for (const job of discovered) {
        // Check if already applied to this URL
        const dedupCheck = await db.execute({
          sql: `SELECT 1 FROM BrowseDiscovery WHERE sessionId IN (SELECT id FROM BrowseSession WHERE userId = ?) AND applyUrl = ? AND status = 'applied' LIMIT 1`,
          args: [session.userId, job.applyUrl],
        });

        if (dedupCheck.rows && dedupCheck.rows.length > 0) {
          companyResult.skipped++;
          continue;
        }

        // Check monthly quota
        const quotaCheck = await db.execute({
          sql: `SELECT monthlyAppCount, subscriptionTier FROM User WHERE id = ?`,
          args: [session.userId],
        });
        const currentUser = quotaCheck.rows?.[0] as unknown as { monthlyAppCount: number; subscriptionTier: string } | undefined;
        const tierLimits: Record<string, number> = { free: 5, starter: 100, pro: 300 };
        const limit = tierLimits[currentUser?.subscriptionTier || "free"] || 5;
        if (currentUser && currentUser.monthlyAppCount >= limit) {
          companyResult.skipped++;
          await createDiscovery(session.id, companyName, job.title, job.applyUrl, "skipped", "Monthly limit reached");
          limitReached = true;
          console.log(`[Browse] Monthly limit reached (${currentUser.monthlyAppCount}/${limit}). Stopping session.`);
          break;
        }

        // Record discovery
        await createDiscovery(session.id, companyName, job.title, job.applyUrl, "applying", null);

        // Apply
        const applyResult = await applyToJob(
          job.applyUrl,
          {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.applicationEmail || user.email,
            phone: user.phone,
            preferredName: user.preferredName || undefined,
            pronouns: user.pronouns || undefined,
            usState: user.usState || undefined,
            workAuthorized: user.workAuthorized === 1,
            needsSponsorship: user.needsSponsorship === 1,
            countryOfResidence: user.countryOfResidence || undefined,
            willingToRelocate: user.willingToRelocate === 1,
            remotePreference: user.remotePreference || undefined,
            linkedinUrl: user.linkedinUrl || undefined,
            githubUrl: user.githubUrl || undefined,
            websiteUrl: user.websiteUrl || undefined,
            currentEmployer: user.currentEmployer || undefined,
            currentTitle: user.currentTitle || undefined,
            school: user.school || undefined,
            degree: user.degree || undefined,
            graduationYear: user.graduationYear || undefined,
            additionalCerts: user.additionalCerts || undefined,
            city: user.city || undefined,
            yearsOfExperience: user.yearsOfExperience || undefined,
            salaryExpectation: user.salaryExpectation || undefined,
            earliestStartDate: user.earliestStartDate || undefined,
            gender: user.gender || undefined,
            race: user.race || undefined,
            hispanicOrLatino: user.hispanicOrLatino || undefined,
            veteranStatus: user.veteranStatus || undefined,
            disabilityStatus: user.disabilityStatus || undefined,
            applicationAnswers: user.applicationAnswers || undefined,
            targetCompany: companyName,
          },
          session.resumeUrl,
          session.resumeName,
          session.targetRole
        );

        // Log the apply steps if available
        if (applyResult.steps) {
          for (const s of applyResult.steps) {
            console.log(`[Apply] ${job.title}: ${s}`);
          }
        }

        if (applyResult.success) {
          companyResult.applied++;
          await updateDiscoveryStatus(session.id, job.applyUrl, "applied", null);
          await db.execute({
            sql: `UPDATE BrowseSession SET jobsApplied = jobsApplied + 1 WHERE id = ?`,
            args: [session.id],
          });
          await db.execute({
            sql: `UPDATE User SET monthlyAppCount = monthlyAppCount + 1 WHERE id = ?`,
            args: [session.userId],
          });
        } else {
          companyResult.failed++;
          const errorWithSteps = applyResult.steps
            ? `${applyResult.error} | Steps: ${applyResult.steps.slice(-3).join(" → ")}`
            : applyResult.error || "Unknown error";
          await updateDiscoveryStatus(session.id, job.applyUrl, "failed", errorWithSteps);
          await db.execute({
            sql: `UPDATE BrowseSession SET jobsFailed = jobsFailed + 1 WHERE id = ?`,
            args: [session.id],
          });
        }

        // Delay between applications
        await delay(DELAY_BETWEEN_JOBS_MS);
      }

      await appendProgressLog(session.id, {
        company: companyName,
        status: "done",
        found: companyResult.found,
        applied: companyResult.applied,
        skipped: companyResult.skipped,
        failed: companyResult.failed,
        debugLog: discoveryLog.steps,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[Browse] Error browsing ${companyName}:`, errMsg);
      await appendProgressLog(session.id, {
        company: companyName,
        status: "error",
        error: errMsg,
        found: companyResult.found,
        applied: companyResult.applied,
      });
    }

    await incrementCompanyDone(session.id);

    // Delay between companies
    if (companies.indexOf(companyName) < companies.length - 1) {
      await delay(DELAY_BETWEEN_COMPANIES_MS);
    }
  }

  // Clean up resume
  if (resumePath) {
    try { unlinkSync(resumePath); } catch {}
  }

  // Mark session completed
  await db.execute({
    sql: `UPDATE BrowseSession SET status = 'completed', completedAt = datetime('now') WHERE id = ?`,
    args: [session.id],
  });

  console.log(`[Browse] Session ${session.id} completed`);
  return true;
}

async function markSessionFailed(sessionId: string, error: string) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE BrowseSession SET status = 'failed', errorMessage = ?, completedAt = datetime('now') WHERE id = ?`,
    args: [error, sessionId],
  });
}

async function incrementCompanyDone(sessionId: string) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE BrowseSession SET companiesDone = companiesDone + 1 WHERE id = ?`,
    args: [sessionId],
  });
}

async function appendProgressLog(
  sessionId: string,
  entry: Record<string, unknown>
) {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT progressLog FROM BrowseSession WHERE id = ?`,
    args: [sessionId],
  });
  const current = JSON.parse(
    (result.rows?.[0] as unknown as { progressLog: string })?.progressLog || "[]"
  );
  current.push(entry);
  await db.execute({
    sql: `UPDATE BrowseSession SET progressLog = ? WHERE id = ?`,
    args: [JSON.stringify(current), sessionId],
  });
}

async function createDiscovery(
  sessionId: string,
  company: string,
  jobTitle: string,
  applyUrl: string,
  status: string,
  errorMessage: string | null
) {
  const db = getDb();
  const id = `disc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.execute({
    sql: `INSERT OR IGNORE INTO BrowseDiscovery (id, sessionId, company, jobTitle, applyUrl, status, errorMessage, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [id, sessionId, company, jobTitle, applyUrl, status, errorMessage],
  });
}

async function updateDiscoveryStatus(
  sessionId: string,
  applyUrl: string,
  status: string,
  errorMessage: string | null
) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE BrowseDiscovery SET status = ?, errorMessage = ? WHERE sessionId = ? AND applyUrl = ?`,
    args: [status, errorMessage, sessionId, applyUrl],
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

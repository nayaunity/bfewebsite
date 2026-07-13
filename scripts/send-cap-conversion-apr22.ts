/**
 * One-shot: approve the pending Apr 22 cap-conversion digest for Rishendra.
 * Mirrors /api/admin/cap-conversion/send route behavior.
 */
import { createClient } from "@libsql/client";
import Stripe from "stripe";
import { Resend } from "resend";

const db = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia" as any,
});
const resend = new Resend(process.env.RESEND_API_KEY!);

const TOKEN = "f65b6769b4a02713fa46643ba0bb4906dabb67eb9336c92d19867041377ea927";
const COUPON_WINDOW_HOURS = 72;
const BLOCKED = [
  "openai",
  "ramp",
  "notion",
  "perplexity",
  "linear",
  "elevenlabs",
  "duolingo",
  "samsara",
  "grammarly",
];

function cap(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
function parseRoles(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [raw];
  } catch {
    return [raw];
  }
}
function kwFor(role: string): string[] {
  const r = role.toLowerCase();
  if (r.includes("ai / ml") || r.includes("machine learning"))
    return ["machine learning", "ml engineer", " ai "];
  if (r.includes("product manager")) return ["product manager"];
  if (r.includes("engineering manager"))
    return ["engineering manager", "eng manager"];
  if (r.includes("data engineer"))
    return ["data engineer", "data platform", "data engineering"];
  if (r.includes("full stack")) return ["full stack", "fullstack", "full-stack"];
  if (r.includes("backend")) return ["backend", "back-end", "back end"];
  if (r.includes("frontend"))
    return ["frontend", "front-end", "front end", "ui engineer", "ui software"];
  return [r];
}

async function main() {
  const digestRow = (
    await db.execute({
      sql: "SELECT * FROM CapConversionDigest WHERE token = ?",
      args: [TOKEN],
    })
  ).rows[0] as any;
  if (!digestRow) throw new Error("digest not found");
  if (digestRow.status !== "pending")
    throw new Error("digest not pending: " + digestRow.status);

  const userIds: string[] = JSON.parse(digestRow.candidateUserIds);
  console.log("Candidates:", userIds.length);

  const nowIso = new Date().toISOString();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const uid of userIds) {
    const u = (
      await db.execute({
        sql: "SELECT id, email, firstName, subscriptionTier, conversionEmailSentAt, targetRole FROM User WHERE id = ?",
        args: [uid],
      })
    ).rows[0] as any;
    if (!u) {
      skipped++;
      continue;
    }
    if (u.subscriptionTier !== "free" || u.conversionEmailSentAt) {
      console.log(
        "skip:",
        u.email,
        "tier=",
        u.subscriptionTier,
        "already=",
        u.conversionEmailSentAt
      );
      skipped++;
      continue;
    }

    const first = cap(((u.firstName as string) || "there").trim().split(/\s+/)[0]);
    const roles = parseRoles(u.targetRole);
    const primary = roles[0] || "engineering";

    const applies = await db.execute({
      sql: "SELECT d.company FROM BrowseDiscovery d JOIN BrowseSession s ON s.id=d.sessionId WHERE s.userId=? AND d.status='applied'",
      args: [uid],
    });
    const counts = new Map<string, number>();
    for (const r of applies.rows as any[]) {
      counts.set(r.company, (counts.get(r.company) || 0) + 1);
    }
    const topCos = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([c]) => c);
    const companiesText =
      topCos.length === 2
        ? `${topCos[0]}, ${topCos[1]}`
        : topCos[0] || "top companies";

    const blockedList = BLOCKED.map((s) => `'${s}'`).join(",");
    const jobs = await db.execute(
      `SELECT company, title FROM Job WHERE isActive=1 AND source='auto-apply' AND region IN ('us','both') AND companySlug NOT IN (${blockedList}) LIMIT 500`
    );
    const jobsArr = jobs.rows as any[];
    const picks: { company: string; title: string }[] = [];
    const seen = new Set<string>();
    const lower = (s: string) => s.toLowerCase();
    for (const role of roles.length ? roles : [primary]) {
      if (picks.length >= 3) break;
      const kws = kwFor(role).map(lower);
      for (const j of jobsArr) {
        if (picks.length >= 3) break;
        if (seen.has(j.company)) continue;
        if (!kws.some((k) => lower(j.title || "").includes(k))) continue;
        seen.add(j.company);
        picks.push({ company: j.company, title: j.title });
      }
    }
    for (const j of jobsArr) {
      if (picks.length >= 3) break;
      if (seen.has(j.company)) continue;
      seen.add(j.company);
      picks.push({ company: j.company, title: j.title });
    }
    while (picks.length < 3) picks.push({ company: "-", title: "-" });

    const couponId = `CAP_${uid.slice(-8)}_${Date.now()}`;
    await stripe.coupons.create({
      id: couponId,
      percent_off: 50,
      duration: "once",
      redeem_by: Math.floor(Date.now() / 1000) + COUPON_WINDOW_HOURS * 3600,
      max_redemptions: 1,
      name: `Cap Conversion 50% Off (${uid.slice(-8)})`,
    });

    const checkoutUrl = `https://www.theblackfemaleengineer.com/api/stripe/convert?tier=starter&coupon=${couponId}&email=${encodeURIComponent(u.email)}`;
    const subject = `${first}, your job pipeline hit the free limit`;
    const text = `Hey ${first},

Your applications to ${companiesText} are live, and you've hit your 5-app free limit. 5,000+ new jobs were just added. Unlock 100 apps/mo for $14.50 (normally $29, 50% off for the next 72 hours). Cancel anytime.

Unlock 100 Apps/Mo for $14.50 (50% off): ${checkoutUrl}

A few ${primary} roles open right now:
  ${picks[0].title} at ${picks[0].company}
  ${picks[1].title} at ${picks[1].company}
  ${picks[2].title} at ${picks[2].company}

The average job search takes 100+ applications. You've sent 5 - that's $0.15 per application on Starter.

Naya`;
    const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 560px;">
  <p style="font-size: 20px; font-weight: 700; margin: 0 0 18px;">the<span style="color: #ef562a;">BFE</span></p>
  <p style="margin: 0 0 12px;">Hey ${first},</p>
  <p style="margin: 0 0 14px;">Your applications to <strong>${companiesText}</strong> are live, and you've hit your <strong>5-app free limit</strong>. 5,000+ new jobs were just added. Unlock 100 apps/mo for <strong>$14.50</strong> (normally $29, 50% off for the next 72 hours).</p>
  <p style="text-align: center; margin: 18px 0 20px;"><a href="${checkoutUrl}" style="display: inline-block; background: #ef562a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Unlock 100 Apps/Mo - $14.50 (50% off)</a></p>
  <p style="margin: 0 0 8px;">A few ${primary} roles open right now:</p>
  <ul style="list-style: none; padding-left: 20px; margin: 0 0 14px;">
    <li style="margin-bottom: 4px;"><strong>${picks[0].title}</strong> at ${picks[0].company}</li>
    <li style="margin-bottom: 4px;"><strong>${picks[1].title}</strong> at ${picks[1].company}</li>
    <li style="margin-bottom: 4px;"><strong>${picks[2].title}</strong> at ${picks[2].company}</li>
  </ul>
  <p style="margin: 0 0 14px;">The average job search takes 100+ applications. You've sent 5 - that's $0.15 per application on Starter. Cancel anytime.</p>
  <p style="margin: 0;">Naya</p>
</div>`;

    try {
      const res = await resend.emails.send({
        from: "Naya <naya@theblackfemaleengineer.com>",
        replyTo: "theblackfemaleengineer@gmail.com",
        to: u.email,
        subject,
        html,
        text,
      });
      const id = (res as { data?: { id: string } }).data?.id;
      await db.execute({
        sql: "UPDATE User SET conversionEmailSentAt = ? WHERE id = ?",
        args: [nowIso, uid],
      });
      console.log(`SENT -> ${u.email} | first=${first} | coupon=${couponId} | id=${id}`);
      sent++;
    } catch (e) {
      console.error(`FAIL -> ${u.email}:`, e instanceof Error ? e.message : e);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  await db.execute({
    sql: "UPDATE CapConversionDigest SET status='approved', approvedAt=?, sentCount=? WHERE token=?",
    args: [nowIso, sent, TOKEN],
  });
  console.log(`DIGEST approved. sent=${sent} skipped=${skipped} failed=${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));

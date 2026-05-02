import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { getCurrentPeriodStart } from "@/lib/subscription";

const BLOCKED_COMPANIES = [
  "openai", "ramp", "notion", "perplexity", "linear", "elevenlabs",
  "duolingo", "samsara", "grammarly",
];

const COUPON_WINDOW_HOURS = 72;

function parseRoles(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [raw];
  } catch {
    return [raw];
  }
}

function keywordsForRole(role: string): string[] {
  const r = role.toLowerCase();
  if (r.includes("engineering manager")) return ["engineering manager", "eng manager"];
  if (r.includes("data engineer")) return ["data engineer", "data platform", "data engineering"];
  if (r.includes("full stack")) return ["full stack", "fullstack", "full-stack"];
  if (r.includes("backend")) return ["backend", "back-end", "back end"];
  if (r.includes("frontend")) return ["frontend", "front-end", "front end", "ui engineer", "ui software"];
  if (r.includes("ux researcher")) return ["ux researcher", "user researcher", "design researcher"];
  if (r.includes("product designer") || r.includes("ux / product")) return ["product designer", "ux designer"];
  if (r.includes("solutions architect")) return ["solutions architect", "solution architect"];
  if (r.includes("qa") || r.includes("test")) return ["qa engineer", "test engineer", "sdet"];
  if (r.includes("ai / ml") || r.includes("machine learning")) return ["machine learning", "ml engineer", " ai "];
  if (r.includes("product manager")) return ["product manager"];
  return [r];
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function findOpenRoles(
  targetRoles: string[],
  limit = 3
): Promise<{ company: string; title: string }[]> {
  const jobs = await prisma.job.findMany({
    where: {
      isActive: true,
      source: "auto-apply",
      region: { in: ["us", "both"] },
      NOT: { companySlug: { in: BLOCKED_COMPANIES } },
    },
    select: { company: true, title: true },
    take: 500,
  });
  const lower = (s: string) => s.toLowerCase();
  const seen = new Set<string>();
  const picks: { company: string; title: string }[] = [];
  const tryPick = (predicate: (j: { company: string; title: string }) => boolean) => {
    for (const j of jobs) {
      if (picks.length >= limit) return;
      if (seen.has(j.company)) continue;
      if (!predicate(j)) continue;
      seen.add(j.company);
      picks.push(j);
    }
  };
  for (const role of targetRoles) {
    if (picks.length >= limit) break;
    const keywords = keywordsForRole(role).map(lower);
    tryPick((j) => keywords.some((k) => lower(j.title).includes(k)));
  }
  if (picks.length < limit && targetRoles.some((r) => /engineer|architect|devops|sre/i.test(r))) {
    tryPick((j) => /engineer|architect/i.test(j.title));
  }
  if (picks.length < limit && targetRoles.some((r) => /designer|ux|researcher/i.test(r))) {
    tryPick((j) => /designer|researcher/i.test(j.title));
  }
  if (picks.length < limit) tryPick(() => true);
  return picks;
}

export interface CapConversionDraft {
  userId: string;
  email: string;
  firstName: string;
  primaryRole: string;
  companiesText: string;
  openRoles: { company: string; title: string }[];
  couponId: string;
  checkoutUrl: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Creates a unique Stripe coupon scoped to a single user, valid for 72 hours.
 * Each email gets its own honest countdown — no shared coupon state.
 */
async function createPerUserCoupon(userId: string): Promise<string> {
  const id = `CAP_${userId.slice(-8)}_${Date.now()}`;
  await stripe.coupons.create({
    id,
    percent_off: 50,
    duration: "once",
    redeem_by: Math.floor(Date.now() / 1000) + COUPON_WINDOW_HOURS * 60 * 60,
    max_redemptions: 1,
    name: `Cap Conversion 50% Off (${userId.slice(-8)})`,
  });
  return id;
}

export async function buildDraft(
  email: string,
  opts: { createCoupon: boolean } = { createCoupon: false }
): Promise<CapConversionDraft> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, targetRole: true },
  });
  if (!user) throw new Error(`User not found: ${email}`);

  const rawFirst = (user.firstName || "there").trim().split(/\s+/)[0];
  const firstName = capitalize(rawFirst);
  const roles = parseRoles(user.targetRole);
  const primary = roles[0] || "engineering";

  const applies = await prisma.browseDiscovery.findMany({
    where: { session: { userId: user.id }, status: "applied" },
    select: { company: true },
  });
  const counts = new Map<string, number>();
  for (const a of applies) counts.set(a.company, (counts.get(a.company) || 0) + 1);
  const topCompanies = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([c]) => c);
  const companiesText =
    topCompanies.length === 2
      ? `${topCompanies[0]}, ${topCompanies[1]}`
      : topCompanies[0] || "top companies";

  const openRoles = await findOpenRoles(roles.length ? roles : [primary]);
  while (openRoles.length < 3) openRoles.push({ company: "-", title: "-" });

  const couponId = opts.createCoupon
    ? await createPerUserCoupon(user.id)
    : "STARTER50";

  const checkoutUrl = `https://www.theblackfemaleengineer.com/api/stripe/convert?tier=starter&coupon=${couponId}&email=${encodeURIComponent(email)}`;

  const subject = `${firstName}, your job pipeline hit the free limit`;

  const text = `Hey ${firstName},

Your applications to ${companiesText} are live, and you've hit your 5-app free limit. 5,000+ new jobs were just added. Unlock 100 apps/mo for $14.50 (normally $29, 50% off for the next 72 hours). Cancel anytime.

Unlock 100 Apps/Mo for $14.50 (50% off): ${checkoutUrl}

A few ${primary} roles open right now:
  ${openRoles[0].title} at ${openRoles[0].company}
  ${openRoles[1].title} at ${openRoles[1].company}
  ${openRoles[2].title} at ${openRoles[2].company}

The average job search takes 100+ applications. You've sent 5 - that's $0.15 per application on Starter.

Naya`;

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 560px;">
  <p style="font-size: 20px; font-weight: 700; margin: 0 0 18px;">the<span style="color: #ef562a;">BFE</span></p>
  <p style="margin: 0 0 12px;">Hey ${firstName},</p>
  <p style="margin: 0 0 14px;">Your applications to <strong>${companiesText}</strong> are live, and you've hit your <strong>5-app free limit</strong>. 5,000+ new jobs were just added. Unlock 100 apps/mo for <strong>$14.50</strong> (normally $29, 50% off for the next 72 hours).</p>
  <p style="text-align: center; margin: 18px 0 20px;"><a href="${checkoutUrl}" style="display: inline-block; background: #ef562a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Unlock 100 Apps/Mo - $14.50 (50% off)</a></p>
  <p style="margin: 0 0 8px;">A few ${primary} roles open right now:</p>
  <ul style="list-style: none; padding-left: 20px; margin: 0 0 14px;">
    <li style="margin-bottom: 4px;"><strong>${openRoles[0].title}</strong> at ${openRoles[0].company}</li>
    <li style="margin-bottom: 4px;"><strong>${openRoles[1].title}</strong> at ${openRoles[1].company}</li>
    <li style="margin-bottom: 4px;"><strong>${openRoles[2].title}</strong> at ${openRoles[2].company}</li>
  </ul>
  <p style="margin: 0 0 14px;">The average job search takes 100+ applications. You've sent 5 - that's $0.15 per application on Starter. Cancel anytime.</p>
  <p style="margin: 0;">Naya</p>
</div>`;

  return {
    userId: user.id,
    email,
    firstName,
    primaryRole: primary,
    companiesText,
    openRoles,
    couponId,
    checkoutUrl,
    subject,
    text,
    html,
  };
}

/**
 * Find users who capped out within the last 24 hours and haven't received the
 * conversion email. "Capped" = their 5th successful BrowseDiscovery.applied
 * was created in the last 24h.
 */
export async function findCapConversionCandidates(): Promise<
  { userId: string; email: string; cappedAt: Date }[]
> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      monthlyAppCount: { gte: 5 },
      subscriptionTier: "free",
      role: { notIn: ["test", "admin"] },
      emailVerified: { not: null },
      conversionEmailSentAt: null,
      // Sunset email takes precedence near the wall: skip users who already
      // got the sunset warning OR are within 7 days of their wall. Otherwise
      // they would receive cap-conversion + sunset back-to-back.
      freeTierSunsetEmailAt: null,
      OR: [
        { freeTierEndsAt: null },
        { freeTierEndsAt: { gt: sevenDaysOut } },
      ],
    },
    select: { id: true, email: true, subscribedAt: true, createdAt: true },
  });

  const candidates: { userId: string; email: string; cappedAt: Date }[] = [];

  for (const u of users) {
    const periodStart = getCurrentPeriodStart(u);
    const applies = await prisma.browseDiscovery.findMany({
      where: {
        session: { userId: u.id },
        status: "applied",
        createdAt: { gte: periodStart },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
      take: 5,
    });
    if (applies.length < 5) continue;
    const fifthCreatedAt = applies[4].createdAt;
    if (fifthCreatedAt >= since) {
      candidates.push({ userId: u.id, email: u.email, cappedAt: fifthCreatedAt });
    }
  }

  return candidates;
}

export { STRIPE_PRICES };

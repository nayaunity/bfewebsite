import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { computeRegion } from '../src/lib/job-region';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: 'number' as const,
});
const prisma = new PrismaClient({ adapter } as any);

const NEW_COMPANIES: Array<{
  name: string;
  slug: string;
  ats: "greenhouse" | "workday" | "ashby";
  boardToken?: string;
  boardSlug?: string;
  baseUrl?: string;
  company?: string;
  siteName?: string;
}> = [
  // Greenhouse (native URLs verified)
  { name: "Verkada", slug: "verkada", boardToken: "verkada", ats: "greenhouse" },
  { name: "PagerDuty", slug: "pagerduty", boardToken: "pagerduty", ats: "greenhouse" },
  { name: "Tanium", slug: "tanium", boardToken: "tanium", ats: "greenhouse" },
  { name: "Chainguard", slug: "chainguard", boardToken: "chainguard", ats: "greenhouse" },
  { name: "Lithic", slug: "lithic", boardToken: "lithic", ats: "greenhouse" },
  { name: "HeyGen", slug: "heygen", boardToken: "heygen", ats: "greenhouse" },
  { name: "Calendly", slug: "calendly", boardToken: "calendly", ats: "greenhouse" },
  { name: "Braze", slug: "braze", boardToken: "braze", ats: "greenhouse" },
  { name: "Iterable", slug: "iterable", boardToken: "iterable", ats: "greenhouse" },
  { name: "DeepMind", slug: "deepmind", boardToken: "deepmind", ats: "greenhouse" },
  { name: "Kalshi", slug: "kalshi", boardToken: "kalshi", ats: "greenhouse" },
  { name: "Medium", slug: "medium", boardToken: "medium", ats: "greenhouse" },
  { name: "Relativity", slug: "relativity", boardToken: "relativity", ats: "greenhouse" },
  // Workday
  { name: "Nvidia", slug: "nvidia", ats: "workday", baseUrl: "https://nvidia.wd5.myworkdayjobs.com", company: "nvidia", siteName: "NVIDIAExternalCareerSite" },
  { name: "Unisys", slug: "unisys", ats: "workday", baseUrl: "https://unisys.wd5.myworkdayjobs.com", company: "unisys", siteName: "External" },
  { name: "Novartis", slug: "novartis", ats: "workday", baseUrl: "https://novartis.wd3.myworkdayjobs.com", company: "novartis", siteName: "Novartis_Careers" },
  { name: "T-Mobile", slug: "tmobile", ats: "workday", baseUrl: "https://tmobile.wd1.myworkdayjobs.com", company: "tmobile", siteName: "External" },
  // Ashby (job board display only)
  { name: "Modal", slug: "modal", boardSlug: "modal", ats: "ashby" },
  { name: "Supabase", slug: "supabase", boardSlug: "supabase", ats: "ashby" },
];

interface GHJob {
  id: number;
  title: string;
  content?: string;
  location: { name: string };
  absolute_url: string;
  updated_at: string;
}

interface WorkdayJob {
  title: string;
  externalPath: string;
  locationsText: string;
  postedOn: string;
}

interface AshbyJob {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  publishedAt: string;
  jobUrl: string;
}

async function scrapeGH(boardToken: string): Promise<GHJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.jobs || [];
}

async function scrapeWorkday(baseUrl: string, company: string, siteName: string): Promise<WorkdayJob[]> {
  const url = `${baseUrl}/wday/cxs/${company}/${siteName}/jobs`;
  const allJobs: WorkdayJob[] = [];
  let offset = 0;
  const limit = 20;

  while (offset < 200) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appliedFacets: {}, limit, offset, searchText: "" }),
    });
    if (!res.ok) break;
    const data = await res.json();
    const jobs = data.jobPostings || [];
    allJobs.push(...jobs);
    if (jobs.length < limit) break;
    offset += limit;
  }
  return allJobs;
}

async function scrapeAshby(boardSlug: string): Promise<AshbyJob[]> {
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${boardSlug}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.jobs || [];
}

function parseWorkdayDate(postedOn: string): Date {
  const lower = (postedOn || "").toLowerCase();
  const now = new Date();
  if (lower.includes("today")) return now;
  if (lower.includes("yesterday")) return new Date(now.getTime() - 86400000);
  const m = lower.match(/(\d+)\+?\s*days?\s*ago/);
  if (m) return new Date(now.getTime() - parseInt(m[1]) * 86400000);
  return now;
}

async function main() {
  let totalSaved = 0;
  let totalFound = 0;

  for (const co of NEW_COMPANIES) {
    try {
      if (co.ats === "greenhouse" && co.boardToken) {
        const jobs = await scrapeGH(co.boardToken);
        console.log(`${co.name}: ${jobs.length} jobs found`);
        totalFound += jobs.length;
        let saved = 0;
        for (const job of jobs) {
          const externalId = `gh-${co.boardToken}-${job.id}`;
          const location = job.location?.name || "Unknown";
          const remote = /remote/i.test(location);
          const region = computeRegion(location);
          await prisma.job.upsert({
            where: { externalId_companySlug: { externalId, companySlug: co.slug } },
            update: {
              title: job.title, location, remote, region,
              applyUrl: job.absolute_url,
              description: (job.content || "").slice(0, 5000),
              isActive: true,
              postedAt: new Date(job.updated_at),
            },
            create: {
              externalId, company: co.name, companySlug: co.slug,
              title: job.title, location, remote, region,
              type: "Full-time",
              applyUrl: job.absolute_url,
              description: (job.content || "").slice(0, 5000),
              source: "auto-apply", isActive: true,
              postedAt: new Date(job.updated_at),
              category: "Software Engineering", tags: "[]",
            },
          });
          saved++;
        }
        console.log(`  -> ${saved} saved/updated`);
        totalSaved += saved;

      } else if (co.ats === "workday" && co.baseUrl && co.company && co.siteName) {
        const jobs = await scrapeWorkday(co.baseUrl, co.company, co.siteName);
        console.log(`${co.name}: ${jobs.length} jobs found`);
        totalFound += jobs.length;
        let saved = 0;
        for (const job of jobs) {
          if (!job.externalPath) continue;
          const externalId = `wd-${co.slug}-${job.externalPath.replace(/\//g, '-')}`;
          const location = job.locationsText || "Unknown";
          const remote = /remote/i.test(location);
          const region = computeRegion(location);
          const applyUrl = `${co.baseUrl}/en-US/${co.siteName}${job.externalPath}`;
          await prisma.job.upsert({
            where: { externalId_companySlug: { externalId, companySlug: co.slug } },
            update: {
              title: job.title, location, remote, region, applyUrl,
              isActive: true,
              postedAt: parseWorkdayDate(job.postedOn),
            },
            create: {
              externalId, company: co.name, companySlug: co.slug,
              title: job.title, location, remote, region,
              type: "Full-time", applyUrl,
              source: "auto-apply", isActive: true,
              postedAt: parseWorkdayDate(job.postedOn),
              category: "Software Engineering", tags: "[]",
            },
          });
          saved++;
        }
        console.log(`  -> ${saved} saved/updated`);
        totalSaved += saved;

      } else if (co.ats === "ashby" && co.boardSlug) {
        const jobs = await scrapeAshby(co.boardSlug);
        console.log(`${co.name}: ${jobs.length} jobs found`);
        totalFound += jobs.length;
        let saved = 0;
        for (const job of jobs) {
          const externalId = `ashby-${co.boardSlug}-${job.id}`;
          const location = job.location || "Unknown";
          const remote = /remote/i.test(location);
          const region = computeRegion(location);
          await prisma.job.upsert({
            where: { externalId_companySlug: { externalId, companySlug: co.slug } },
            update: {
              title: job.title, location, remote, region,
              applyUrl: job.jobUrl,
              isActive: true,
              postedAt: new Date(job.publishedAt),
            },
            create: {
              externalId, company: co.name, companySlug: co.slug,
              title: job.title, location, remote, region,
              type: job.employmentType || "Full-time",
              applyUrl: job.jobUrl,
              source: "auto-apply", isActive: true,
              postedAt: new Date(job.publishedAt),
              category: "Software Engineering", tags: "[]",
            },
          });
          saved++;
        }
        console.log(`  -> ${saved} saved/updated`);
        totalSaved += saved;
      }
    } catch (err) {
      console.error(`${co.name}: ERROR -`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nDone: ${totalFound} found, ${totalSaved} saved across ${NEW_COMPANIES.length} companies`);
}

main().finally(() => prisma.$disconnect());

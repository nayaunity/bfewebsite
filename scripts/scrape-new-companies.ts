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
  ats: "greenhouse" | "workday" | "ashby" | "lever";
  boardToken?: string;
  boardSlug?: string;
  companySlug?: string;
  baseUrl?: string;
  company?: string;
  siteName?: string;
}> = [
  // === Lever (May 7 expansion — all slugs verified via api.lever.co) ===
  { name: "Mistral AI", slug: "mistral", companySlug: "mistral", ats: "lever" },
  { name: "Shield AI", slug: "shieldai", companySlug: "shieldai", ats: "lever" },
  { name: "Veeva Systems", slug: "veeva", companySlug: "veeva", ats: "lever" },
  { name: "Gopuff", slug: "gopuff", companySlug: "gopuff", ats: "lever" },
  { name: "Lyra Health", slug: "lyrahealth", companySlug: "lyrahealth", ats: "lever" },
  { name: "WHOOP", slug: "whoop", companySlug: "whoop", ats: "lever" },
  { name: "Octopus Energy", slug: "octoenergy", companySlug: "octoenergy", ats: "lever" },
  { name: "Aircall", slug: "aircall", companySlug: "aircall", ats: "lever" },
  { name: "Hive", slug: "hive", companySlug: "hive", ats: "lever" },
  { name: "Pigment", slug: "pigment", companySlug: "pigment", ats: "lever" },
  { name: "Aledade", slug: "aledade", companySlug: "aledade", ats: "lever" },
  { name: "GRAIL", slug: "grailbio", companySlug: "grailbio", ats: "lever" },
  { name: "Included Health", slug: "includedhealth", companySlug: "includedhealth", ats: "lever" },
  { name: "Loft Orbital", slug: "loftorbital", companySlug: "loftorbital", ats: "lever" },
  { name: "CaptivateIQ", slug: "captivateiq", companySlug: "captivateiq", ats: "lever" },
  // === Greenhouse (May 7 expansion — all tokens verified via boards-api.greenhouse.io) ===
  { name: "Okta", slug: "okta", boardToken: "okta", ats: "greenhouse" },
  { name: "Coupang", slug: "coupang", boardToken: "coupang", ats: "greenhouse" },
  { name: "Roblox", slug: "roblox", boardToken: "roblox", ats: "greenhouse" },
  { name: "Applied Intuition", slug: "appliedintuition", boardToken: "appliedintuition", ats: "greenhouse" },
  { name: "Lyft", slug: "lyft", boardToken: "lyft", ats: "greenhouse" },
  { name: "Block", slug: "block", boardToken: "block", ats: "greenhouse" },
  { name: "Twitch", slug: "twitch", boardToken: "twitch", ats: "greenhouse" },
  { name: "Airbnb", slug: "airbnb", boardToken: "airbnb", ats: "greenhouse" },
  { name: "Waymo", slug: "waymo", boardToken: "waymo", ats: "greenhouse" },
  { name: "Mixpanel", slug: "mixpanel", boardToken: "mixpanel", ats: "greenhouse" },
  { name: "Qualtrics", slug: "qualtrics", boardToken: "qualtrics", ats: "greenhouse" },
  { name: "Peloton", slug: "peloton", boardToken: "peloton", ats: "greenhouse" },
  { name: "Epic Games", slug: "epicgames", boardToken: "epicgames", ats: "greenhouse" },
  { name: "Opendoor", slug: "opendoor", boardToken: "opendoor", ats: "greenhouse" },
  { name: "New Relic", slug: "newrelic", boardToken: "newrelic", ats: "greenhouse" },
  { name: "Sumo Logic", slug: "sumologic", boardToken: "sumologic", ats: "greenhouse" },
  { name: "Nubank", slug: "nubank", boardToken: "nubank", ats: "greenhouse" },
  { name: "Adyen", slug: "adyen", boardToken: "adyen", ats: "greenhouse" },
  { name: "SoFi", slug: "sofi", boardToken: "sofi", ats: "greenhouse" },
  { name: "Upstart", slug: "upstart", boardToken: "upstart", ats: "greenhouse" },
  { name: "Carvana", slug: "carvana", boardToken: "carvana", ats: "greenhouse" },
  // === Workday (May 8 expansion — all tenants verified via CXS API) ===
  { name: "PayPal", slug: "paypal", ats: "workday", baseUrl: "https://paypal.wd1.myworkdayjobs.com", company: "paypal", siteName: "jobs" },
  { name: "General Motors", slug: "generalmotors", ats: "workday", baseUrl: "https://generalmotors.wd5.myworkdayjobs.com", company: "generalmotors", siteName: "Careers_GM" },
  { name: "Verizon", slug: "verizon", ats: "workday", baseUrl: "https://verizon.wd12.myworkdayjobs.com", company: "verizon", siteName: "verizon-careers" },
  { name: "Accenture", slug: "accenture", ats: "workday", baseUrl: "https://accenture.wd103.myworkdayjobs.com", company: "accenture", siteName: "AccentureCareers" },
  { name: "3M", slug: "3m", ats: "workday", baseUrl: "https://3m.wd1.myworkdayjobs.com", company: "3m", siteName: "Search" },
  { name: "Caterpillar", slug: "caterpillar", ats: "workday", baseUrl: "https://cat.wd5.myworkdayjobs.com", company: "cat", siteName: "CaterpillarCareers" },
  { name: "Booz Allen Hamilton", slug: "boozallen", ats: "workday", baseUrl: "https://bah.wd1.myworkdayjobs.com", company: "bah", siteName: "BAH_Jobs" },
  { name: "Broadcom", slug: "broadcom", ats: "workday", baseUrl: "https://broadcom.wd1.myworkdayjobs.com", company: "broadcom", siteName: "External_Career" },
  { name: "RTX", slug: "rtx", ats: "workday", baseUrl: "https://globalhr.wd5.myworkdayjobs.com", company: "globalhr", siteName: "REC_RTX_Ext_Gateway" },
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

interface LeverJob {
  id: string;
  text: string;
  hostedUrl: string;
  categories: { location?: string; commitment?: string };
  createdAt: number;
  descriptionPlain?: string;
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

async function scrapeLever(companySlug: string): Promise<LeverJob[]> {
  const url = `https://api.lever.co/v0/postings/${companySlug}?limit=100`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
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

      } else if (co.ats === "lever" && co.companySlug) {
        const jobs = await scrapeLever(co.companySlug);
        console.log(`${co.name}: ${jobs.length} jobs found`);
        totalFound += jobs.length;
        let saved = 0;
        for (const job of jobs) {
          const externalId = `lv-${co.companySlug}-${job.id}`;
          const location = job.categories?.location || "Unknown";
          const remote = /remote/i.test(location);
          const region = computeRegion(location);
          await prisma.job.upsert({
            where: { externalId_companySlug: { externalId, companySlug: co.slug } },
            update: {
              title: job.text, location, remote, region,
              applyUrl: job.hostedUrl,
              description: (job.descriptionPlain || "").slice(0, 5000),
              isActive: true,
              postedAt: new Date(job.createdAt),
            },
            create: {
              externalId, company: co.name, companySlug: co.slug,
              title: job.text, location, remote, region,
              type: job.categories?.commitment || "Full-time",
              applyUrl: job.hostedUrl,
              description: (job.descriptionPlain || "").slice(0, 5000),
              source: "auto-apply", isActive: true,
              postedAt: new Date(job.createdAt),
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

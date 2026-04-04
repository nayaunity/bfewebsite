import "server-only";
import { prisma } from "@/lib/prisma";
import { ROLE_OPTIONS } from "@/lib/role-options";

export interface MatchedJob {
  id: string;
  title: string;
  applyUrl: string;
  company: string;
  companySlug: string;
  location: string;
  remote: boolean;
  score: number;
}

function parseRoles(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* not JSON, treat as single role */
  }
  return raw.trim() ? [raw.trim()] : [];
}

function getSearchKeywords(roleLabels: string[]): string[][] {
  return roleLabels.flatMap((label) => {
    const roleOption = ROLE_OPTIONS.find((r) => r.label === label);
    if (!roleOption) return [label.toLowerCase().split(/\s+/).filter((w) => w.length > 2)];
    return roleOption.searchTerms.split(",").map((term) =>
      term.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 2)
    );
  });
}

function roleMatchScore(title: string, keywordSets: string[][]): number {
  const titleLower = title.toLowerCase();
  let bestScore = 0;

  for (const keywords of keywordSets) {
    const matches = keywords.filter((kw) => titleLower.includes(kw));
    if (matches.length >= 2 || (keywords.length === 1 && matches.length === 1)) {
      const score = matches.length / keywords.length;
      bestScore = Math.max(bestScore, score);
    }
  }

  return bestScore;
}

// Countries/regions that indicate a non-US job
const NON_US_INDICATORS = [
  "india", "ireland", "uk", "united kingdom", "england", "germany", "france",
  "japan", "singapore", "australia", "brazil", "canada", "italy", "spain",
  "netherlands", "sweden", "denmark", "norway", "finland", "poland", "czech",
  "israel", "korea", "china", "hong kong", "taiwan", "mexico", "argentina",
  "colombia", "chile", "peru", "bangalore", "bengaluru", "hyderabad", "mumbai",
  "pune", "delhi", "chennai", "london", "berlin", "paris", "tokyo", "sydney",
  "melbourne", "toronto", "vancouver", "montreal", "dublin", "amsterdam",
  "singapore", "são paulo", "sao paulo", "tel aviv", "seoul", "shanghai",
  "beijing", "krakow", "warsaw", "stockholm", "copenhagen", "oslo", "helsinki",
  "zurich", "geneva", "munich", "hamburg", "barcelona", "madrid", "lisbon",
  "milan", "rome", "vienna", "brussels", "prague",
];

// US indicators — if location contains these, it's likely a US job
const US_INDICATORS = [
  "united states", "usa", "us-remote", "remote - us", "remote-us",
  // US states
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado",
  "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho",
  "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana",
  "maine", "maryland", "massachusetts", "michigan", "minnesota",
  "mississippi", "missouri", "montana", "nebraska", "nevada",
  "new hampshire", "new jersey", "new mexico", "new york", "north carolina",
  "north dakota", "ohio", "oklahoma", "oregon", "pennsylvania",
  "rhode island", "south carolina", "south dakota", "tennessee", "texas",
  "utah", "vermont", "virginia", "washington", "west virginia", "wisconsin",
  "wyoming",
  // Common US city names
  "san francisco", "los angeles", "chicago", "seattle", "denver",
  "new york", "boston", "austin", "portland", "atlanta", "miami",
  "dallas", "houston", "phoenix", "philadelphia", "san diego",
  "san jose", "sunnyvale", "mountain view", "palo alto", "menlo park",
  // State abbreviations (with boundaries to avoid false matches)
  " ca", " ny", " wa", " tx", " il", " co", " ma", " ga", " pa",
  ", ca", ", ny", ", wa", ", tx", ", il", ", co", ", ma", ", ga", ", pa",
];

function isUSJob(location: string): boolean {
  const loc = location.toLowerCase();
  // Check if explicitly US
  if (US_INDICATORS.some((ind) => loc.includes(ind))) return true;
  // "US" alone as the entire location
  if (loc.trim() === "us" || loc.trim() === "n/a") return true;
  return false;
}

function isForeignJob(location: string): boolean {
  const loc = location.toLowerCase();
  return NON_US_INDICATORS.some((ind) => loc.includes(ind));
}

function locationMatchScore(
  jobLocation: string,
  jobRemote: boolean,
  userPref: string | null,
  userState: string | null,
  userCity: string | null,
  userCountry: string | null
): number {
  const locLower = jobLocation.toLowerCase();

  // Hard filter: skip foreign jobs for US-based users
  const userIsUS = !userCountry || userCountry.toLowerCase().includes("us") ||
    userCountry.toLowerCase().includes("united states") ||
    userCountry.toLowerCase().includes("america");

  if (userIsUS && isForeignJob(locLower) && !isUSJob(locLower)) {
    return -1; // Signal to exclude this job
  }

  if (!userPref) return 0.5;

  if (userPref === "Remote") {
    return jobRemote ? 1 : 0.3;
  }

  // On-site or Hybrid
  if (jobRemote) return 0.6;

  let score = 0.3;
  if (userCity && locLower.includes(userCity.toLowerCase())) score = 1;
  else if (userState && locLower.includes(userState.toLowerCase())) score = 0.8;

  return score;
}

function seniorityMatchScore(
  title: string,
  yearsOfExperience: string | null
): number {
  if (!yearsOfExperience) return 0.5;

  const years = parseInt(yearsOfExperience, 10);
  if (isNaN(years)) return 0.5;

  const titleLower = title.toLowerCase();
  const isIntern = /\bintern\b/.test(titleLower);
  const isNewGrad = /\bnew grad\b|\bentry.level\b|\bgraduate\b/.test(titleLower);
  const isSenior = /\b(senior|sr\.?|staff|principal|director|lead|head)\b/.test(titleLower);
  const isJunior = /\b(junior|jr\.?|associate)\b/.test(titleLower);

  // Intern is a hard filter for anyone with 3+ years
  if (isIntern && years >= 3) return -1;
  // New grad is a hard filter for anyone with 4+ years
  if (isNewGrad && years >= 4) return -1;

  if (years <= 2) {
    if (isSenior) return 0.1;
    if (isJunior || isIntern || isNewGrad) return 1;
    return 0.6;
  }

  if (years <= 5) {
    if (isJunior) return 0.3;
    if (/\b(principal|director|head)\b/.test(titleLower)) return 0.2;
    return 0.8;
  }

  // 6+ years
  if (isJunior) return 0.1;
  if (isSenior) return 1;
  return 0.7;
}

export async function matchJobsForUser(
  userId: string,
  maxJobs: number = 10
): Promise<MatchedJob[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      targetRole: true,
      remotePreference: true,
      usState: true,
      city: true,
      yearsOfExperience: true,
      countryOfResidence: true,
    },
  });

  if (!user?.targetRole) return [];

  const roleLabels = parseRoles(user.targetRole);
  if (roleLabels.length === 0) return [];

  const keywordSets = getSearchKeywords(roleLabels);

  const catalogJobs = await prisma.job.findMany({
    where: {
      source: "auto-apply",
      isActive: true,
    },
    select: {
      id: true,
      title: true,
      applyUrl: true,
      company: true,
      companySlug: true,
      location: true,
      remote: true,
    },
  });

  // Dedup — jobs user already applied to
  const [browseApplied, directApplied] = await Promise.all([
    prisma.browseDiscovery.findMany({
      where: {
        session: { userId },
        status: { in: ["applied", "applying"] },
      },
      select: { applyUrl: true },
    }),
    prisma.jobApplication.findMany({
      where: {
        userId,
        status: { in: ["submitted", "pending"] },
      },
      select: { job: { select: { applyUrl: true } } },
    }),
  ]);

  const appliedUrls = new Set([
    ...browseApplied.map((d) => d.applyUrl),
    ...directApplied.map((a) => a.job.applyUrl),
  ]);

  const scored: MatchedJob[] = [];

  for (const job of catalogJobs) {
    if (appliedUrls.has(job.applyUrl)) continue;

    const roleScore = roleMatchScore(job.title, keywordSets);
    if (roleScore === 0) continue;

    const locScore = locationMatchScore(
      job.location,
      job.remote,
      user.remotePreference,
      user.usState,
      user.city,
      user.countryOfResidence
    );
    // -1 means hard exclude (foreign job for US user)
    if (locScore === -1) continue;

    const seniorityScore = seniorityMatchScore(job.title, user.yearsOfExperience);
    // -1 means hard exclude (intern for experienced user)
    if (seniorityScore === -1) continue;

    const score = roleScore * 0.5 + locScore * 0.3 + seniorityScore * 0.2;

    scored.push({
      id: job.id,
      title: job.title,
      applyUrl: job.applyUrl,
      company: job.company,
      companySlug: job.companySlug,
      location: job.location,
      remote: job.remote,
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxJobs);
}

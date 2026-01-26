/**
 * Hacker News "Who's Hiring" Scraper - Proof of Concept
 *
 * Fetches job postings from HN monthly hiring threads and parses them
 * into a structured format compatible with the Job schema.
 */

interface HNComment {
  id: number;
  text: string;
  by: string;
  time: number;
  parent: number;
}

interface ParsedJob {
  company: string;
  title: string;
  location: string;
  remote: boolean;
  type: string;
  applyUrl: string | null;
  salary: string | null;
  tags: string[];
  rawText: string;
}

// APIs
const ALGOLIA_API = 'https://hn.algolia.com/api/v1';
const FIREBASE_API = 'https://hacker-news.firebaseio.com/v0';

/**
 * Find the most recent "Who is hiring" thread
 */
async function findLatestHiringThread(): Promise<{ id: string; title: string; date: string } | null> {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

  const now = new Date();
  const year = now.getFullYear();
  const month = months[now.getMonth()];

  // Try current month first, then previous month
  for (const searchMonth of [month, months[(now.getMonth() - 1 + 12) % 12]]) {
    const searchYear = searchMonth === 'December' && month === 'January' ? year - 1 : year;
    const query = `Who is hiring ${searchMonth} ${searchYear}`;

    const response = await fetch(
      `${ALGOLIA_API}/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=5`
    );
    const data = await response.json();

    const thread = data.hits?.find((hit: any) =>
      hit.title?.toLowerCase().includes('who is hiring') &&
      hit.title?.includes(searchMonth) &&
      hit.title?.includes(String(searchYear))
    );

    if (thread) {
      return {
        id: thread.objectID,
        title: thread.title,
        date: thread.created_at
      };
    }
  }

  return null;
}

/**
 * Fetch a single item from HN Firebase API
 */
async function fetchHNItem(id: number): Promise<any> {
  const response = await fetch(`${FIREBASE_API}/item/${id}.json`);
  return response.json();
}

/**
 * Fetch top-level comments (job postings) from a thread using Firebase API
 */
async function fetchJobComments(threadId: string, limit: number = 50): Promise<any[]> {
  // First get the thread to find comment IDs
  const thread = await fetchHNItem(parseInt(threadId));
  const commentIds = thread.kids?.slice(0, limit) || [];

  // Fetch comments in parallel (batches of 10 to avoid rate limiting)
  const comments: any[] = [];
  for (let i = 0; i < commentIds.length; i += 10) {
    const batch = commentIds.slice(i, i + 10);
    const batchResults = await Promise.all(batch.map(fetchHNItem));
    comments.push(...batchResults.filter(c => c && c.text));
  }

  return comments;
}

/**
 * Decode HTML entities
 */
function decodeHTML(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Parse a job posting comment into structured data
 */
function parseJobPosting(comment: any): ParsedJob | null {
  const rawText = comment.text || '';
  // Convert HTML to readable text
  const text = decodeHTML(rawText.replace(/<p>/g, '\n').replace(/<[^>]*>/g, ''));

  // Skip empty or very short comments (likely replies, not job posts)
  if (text.length < 50) return null;

  // Skip comments that look like replies/discussions
  const replyIndicators = ['@', 'I think', 'I agree', 'thanks', 'good luck', 'question:'];
  if (replyIndicators.some(ind => text.toLowerCase().startsWith(ind.toLowerCase()))) {
    return null;
  }

  // Common format: "Company | Role | Location | REMOTE"
  // Or: "Company | Location | Role"
  const firstLine = text.split('\n')[0].replace(/<[^>]*>/g, '').trim();

  // Try pipe-separated format first
  let company = '';
  let title = '';
  let location = '';
  let remote = false;

  // Title patterns - things that look like job titles
  const titlePatterns = [
    /engineer/i, /developer/i, /designer/i, /manager/i, /lead/i,
    /architect/i, /scientist/i, /analyst/i, /devops/i, /sre/i,
    /frontend/i, /backend/i, /full.?stack/i, /mobile/i, /ios/i, /android/i,
    /founding/i, /senior/i, /staff/i, /principal/i, /junior/i, /intern/i
  ];

  // Location patterns - things that look like locations
  const locationPatterns = [
    /\b(SF|NYC|LA|CA|NY|TX|WA|UK|USA|EU)\b/i,
    /\b(San Francisco|New York|London|Berlin|Seattle|Austin|Boston|Chicago|Denver|Miami|Paris|Barcelona|Stockholm|Munich|Amsterdam|Toronto|Vancouver)\b/i,
    /\b(California|Texas|Washington|Colorado|Virginia|Florida|Oregon|Pennsylvania|Massachusetts|Georgia)\b/i,
    /\b(Spain|Germany|France|Canada|Australia|India|Japan|Singapore|Netherlands|Ireland|Sweden|Norway|Denmark|Finland|Poland|Portugal|Italy|Switzerland|Austria|Belgium)\b/i,
    /\bremote\b/i, /\bonsite\b/i, /\bhybrid\b/i, /\bvisa\b/i
  ];

  if (firstLine.includes('|')) {
    const parts = firstLine.split('|').map(p => p.trim());

    if (parts.length >= 2) {
      company = parts[0];

      // Collect potential titles and locations
      const potentialTitles: string[] = [];
      const potentialLocations: string[] = [];

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const partLower = part.toLowerCase();

        // Check for remote/onsite/hybrid - these go with location
        if (partLower === 'remote' || partLower === 'fully remote' || partLower === 'onsite' || partLower === 'hybrid') {
          if (partLower.includes('remote')) remote = true;
          continue;
        }

        // Check if it's clearly a title
        const isTitle = titlePatterns.some(p => p.test(part));
        // Check if it's clearly a location
        const isLocation = locationPatterns.some(p => p.test(part));

        if (isTitle && !isLocation) {
          potentialTitles.push(part);
        } else if (isLocation && !isTitle) {
          if (partLower.includes('remote')) remote = true;
          potentialLocations.push(part.replace(/\s*\(?remote\)?/gi, '').trim());
        } else if (isTitle && isLocation) {
          // Ambiguous - prefer title if it has engineer/developer etc
          if (/engineer|developer|designer|manager|scientist/i.test(part)) {
            potentialTitles.push(part);
          } else {
            potentialLocations.push(part);
          }
        } else {
          // Neither - could be either, check structure
          // Job types like "Full-Time" go to neither
          if (/full.?time|part.?time|contract/i.test(partLower)) {
            continue;
          }
          // If it's short and capitalized, might be a location abbreviation
          if (part.length < 10 && /^[A-Z\s]+$/.test(part)) {
            potentialLocations.push(part);
          } else {
            potentialTitles.push(part);
          }
        }
      }

      // Assign best matches
      title = potentialTitles[0] || '';
      location = potentialLocations.join(', ') || '';
    }
  } else {
    // Try to extract from non-pipe format
    company = firstLine.split(/[-–—]/)[0]?.trim() || firstLine.slice(0, 50);
  }

  // Clean up company name (remove common suffixes)
  company = company
    .replace(/\s*\(YC [^)]+\)/g, '') // Remove YC batch info but note it
    .replace(/\s*\([^)]*hiring[^)]*\)/gi, '')
    .trim();

  // If no title found, try to extract from the body
  if (!title) {
    const titleMatch = text.match(/hiring[:\s]+([^.|\n]+)/i) ||
                       text.match(/looking for[:\s]+([^.|\n]+)/i) ||
                       text.match(/seeking[:\s]+([^.|\n]+)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      title = 'Software Engineer'; // Default fallback
    }
  }

  // Extract URLs - look in raw text to preserve URL structure, then decode
  const rawUrlMatch = rawText.match(/https?:&#x2F;&#x2F;[^\s<>"]+|https?:\/\/[^\s<>"]+/);
  let applyUrl: string | null = null;
  if (rawUrlMatch) {
    applyUrl = decodeHTML(rawUrlMatch[0])
      .replace(/&#x2F;/g, '/')
      .replace(/[.,;]$/, '');
  }

  // Extract salary if mentioned
  const salaryMatch = text.match(/\$[\d,]+k?\s*[-–]\s*\$?[\d,]+k?/i) ||
                      text.match(/\$[\d,]+k?(?:\s*\/\s*(?:year|yr|annually))?/i) ||
                      text.match(/[\d,]+k?\s*[-–]\s*[\d,]+k?\s*(?:USD|EUR|GBP)/i);
  const salary = salaryMatch ? salaryMatch[0] : null;

  // Determine job type
  let type = 'Full-time';
  if (/part.?time/i.test(text)) type = 'Part-time';
  if (/contract/i.test(text)) type = 'Contract';
  if (/intern/i.test(text)) type = 'Internship';

  // Extract tags based on technologies mentioned
  const techPatterns = [
    'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Golang',
    'Rust', 'Java', 'Kotlin', 'Swift', 'Ruby', 'Rails', 'Node', 'Django', 'FastAPI',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'AWS', 'GCP', 'Azure', 'Kubernetes',
    'Docker', 'GraphQL', 'REST', 'AI', 'ML', 'Machine Learning', 'LLM', 'NLP'
  ];

  const tags = techPatterns.filter(tech =>
    new RegExp(`\\b${tech}\\b`, 'i').test(text)
  );

  // Skip if we couldn't extract meaningful data
  if (!company || company.length < 2) return null;

  return {
    company,
    title: title || 'Software Engineer',
    location: location || (remote ? 'Remote' : 'Unknown'),
    remote,
    type,
    applyUrl,
    salary,
    tags,
    rawText: text.slice(0, 500) // Keep first 500 chars for reference
  };
}

/**
 * Categorize a job based on title
 */
function categorizeJob(title: string): string {
  const titleLower = title.toLowerCase();

  if (/data.*(scientist|engineer|analyst)|ml|machine learning|ai\b/i.test(titleLower)) {
    return 'Data Science';
  }
  if (/product.*(manager|management)|pm\b/i.test(titleLower)) {
    return 'Product Management';
  }
  if (/devops|sre|platform|infrastructure|reliability/i.test(titleLower)) {
    return 'DevOps/SRE';
  }
  if (/design|ux|ui\b/i.test(titleLower)) {
    return 'Design';
  }
  return 'Software Engineering';
}

/**
 * Convert parsed job to database-ready format
 */
function toJobRecord(parsed: ParsedJob, threadId: string) {
  return {
    externalId: `hn-${threadId}-${parsed.company.toLowerCase().replace(/\s+/g, '-')}`,
    company: parsed.company,
    companySlug: parsed.company.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: parsed.title,
    location: parsed.location,
    type: parsed.type,
    remote: parsed.remote,
    salary: parsed.salary,
    applyUrl: parsed.applyUrl || `https://news.ycombinator.com/item?id=${threadId}`,
    category: categorizeJob(parsed.title),
    tags: JSON.stringify(parsed.tags),
    source: 'hackernews-who-is-hiring',
    isActive: true,
  };
}

// Main execution
async function main() {
  console.log('🔍 Finding latest "Who is hiring" thread...\n');

  const thread = await findLatestHiringThread();

  if (!thread) {
    console.log('❌ Could not find a recent hiring thread');
    return;
  }

  console.log(`📋 Found thread: ${thread.title}`);
  console.log(`   ID: ${thread.id}`);
  console.log(`   Date: ${thread.date}\n`);

  console.log('📥 Fetching job comments...\n');
  const comments = await fetchJobComments(thread.id, 30);

  console.log(`Found ${comments.length} comments to parse\n`);
  console.log('='.repeat(60));

  const jobs: ReturnType<typeof toJobRecord>[] = [];

  for (const comment of comments) {
    const parsed = parseJobPosting(comment);
    if (parsed) {
      const job = toJobRecord(parsed, thread.id);
      jobs.push(job);

      console.log(`\n✅ ${job.company}`);
      console.log(`   Title: ${job.title}`);
      console.log(`   Location: ${job.location}${job.remote ? ' (Remote)' : ''}`);
      console.log(`   Category: ${job.category}`);
      console.log(`   Type: ${job.type}`);
      if (job.salary) console.log(`   Salary: ${job.salary}`);
      if (parsed.tags.length) console.log(`   Tech: ${parsed.tags.join(', ')}`);
      if (job.applyUrl) console.log(`   Apply: ${job.applyUrl}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary: Parsed ${jobs.length} jobs from ${comments.length} comments`);
  console.log(`   Success rate: ${((jobs.length / comments.length) * 100).toFixed(1)}%\n`);

  // Show category breakdown
  const categories = jobs.reduce((acc, job) => {
    acc[job.category] = (acc[job.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📈 Categories:');
  Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });

  // Show sample database record
  if (jobs.length > 0) {
    console.log('\n📝 Sample database record:');
    console.log(JSON.stringify(jobs[0], null, 2));
  }
}

main().catch(console.error);

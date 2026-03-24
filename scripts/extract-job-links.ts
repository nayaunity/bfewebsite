import { readFileSync } from "fs";

// Usage: npx tsx scripts/extract-job-links.ts <snapshot-file> [keyword]
// Extracts job listing links from a Playwright snapshot file

const filePath = process.argv[2];
const keyword = process.argv[3]?.toLowerCase() || "";

if (!filePath) {
  console.error("Usage: npx tsx scripts/extract-job-links.ts <snapshot-file> [keyword]");
  process.exit(1);
}

try {
  const raw = readFileSync(filePath, "utf-8");

  // Parse as JSON if it's a JSON array (Playwright MCP format)
  let text: string;
  try {
    const parsed = JSON.parse(raw);
    text = Array.isArray(parsed) ? parsed[0]?.text || "" : parsed?.text || raw;
  } catch {
    text = raw;
  }

  // Match patterns common in accessibility tree snapshots:
  // - "link "Job Title"" followed by a URL
  // - Lines containing job-related URLs
  const lines = text.split("\n");
  const jobs: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Pattern: link "Some Job Title"
    const linkMatch = line.match(/link\s+"([^"]+)"/);
    if (linkMatch) {
      const title = linkMatch[1];

      // Look for a URL in the same line or next few lines
      let url = "";
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const urlMatch = lines[j].match(/url:\s*(\/jobs\/[^\s]+|https?:\/\/[^\s]+\/jobs\/[^\s]+|\/careers\/[^\s]+)/);
        if (urlMatch) {
          url = urlMatch[1];
          break;
        }
      }

      // Also check if the link text itself looks like a job URL pattern
      if (!url) {
        const hrefMatch = line.match(/\/jobs\/listing\/[^\s"]+|\/careers\/[^\s"]+/);
        if (hrefMatch) url = hrefMatch[0];
      }

      // Filter by keyword if provided
      if (keyword && !title.toLowerCase().includes(keyword)) continue;

      // Skip navigation/non-job links
      const skipPatterns = [
        /^(home|about|blog|contact|sign|log|privacy|terms|cookie|menu|nav|search|filter)/i,
        /^(all |view |see |show |load |more )/i,
      ];
      if (skipPatterns.some((p) => p.test(title))) continue;

      const key = title + url;
      if (!seen.has(key)) {
        seen.add(key);
        jobs.push({ title, url });
      }
    }
  }

  // Also scan for bare job URLs
  const urlPattern = /\/jobs\/listing\/([a-z0-9-]+)/g;
  let urlMatch;
  while ((urlMatch = urlPattern.exec(text)) !== null) {
    const url = urlMatch[0];
    if (!seen.has(url)) {
      seen.add(url);
      // Try to find the title near this URL
      const idx = text.indexOf(url);
      const context = text.slice(Math.max(0, idx - 200), idx);
      const titleMatch = context.match(/link\s+"([^"]+)"/);
      if (titleMatch && (!keyword || titleMatch[1].toLowerCase().includes(keyword))) {
        jobs.push({ title: titleMatch[1], url });
      }
    }
  }

  console.log(JSON.stringify(jobs.slice(0, 50)));
} catch (err) {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
}

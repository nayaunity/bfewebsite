import "dotenv/config";
import { applyToJob, closeBrowser } from "./apply-engine";

const COMPANIES = [
  // Batch 1: Known-good patterns
  { name: "Twilio", url: "https://job-boards.greenhouse.io/twilio/jobs/7738955" },
  { name: "DoorDash", url: "https://job-boards.greenhouse.io/doordashusa/jobs/7651870" },
  { name: "Anthropic", url: "https://job-boards.greenhouse.io/anthropic/jobs/4955107008" },
  { name: "Glean", url: "https://job-boards.greenhouse.io/gleanwork/jobs/4006734005" },
  // Batch 2: Companies with live URLs found
  { name: "Cloudflare", url: "https://boards.greenhouse.io/cloudflare/jobs/7228933?gh_jid=7228933" },
  { name: "Webflow", url: "https://job-boards.greenhouse.io/webflow/jobs/7532377" },
  { name: "ZipRecruiter", url: "https://job-boards.greenhouse.io/ziprecruiter/jobs/6530760" },
  { name: "ClickHouse", url: "https://job-boards.greenhouse.io/clickhouse/jobs/5755082004" },
  { name: "Sigma Computing", url: "https://job-boards.greenhouse.io/sigmacomputing/jobs/7674053003" },
  { name: "Figma (Data Engineer)", url: "https://boards.greenhouse.io/figma/jobs/5220003004?gh_jid=5220003004" },
  { name: "Affirm", url: "https://job-boards.greenhouse.io/affirm/jobs/7646759003" },
  { name: "Discord", url: "https://job-boards.greenhouse.io/discord/jobs/8397385002" },
  { name: "GitLab", url: "https://job-boards.greenhouse.io/gitlab/jobs/8452291002" },
  { name: "Reddit", url: "https://job-boards.greenhouse.io/reddit/jobs/7336592" },
  { name: "Gusto", url: "https://job-boards.greenhouse.io/gusto/jobs/7235805" },
  { name: "Amplitude", url: "https://job-boards.greenhouse.io/amplitude/jobs/8453527002" },
  { name: "Airtable", url: "https://job-boards.greenhouse.io/airtable/jobs/8409166002" },
];

const applicant = {
  firstName: "Nyaradzo",
  lastName: "Bere",
  email: "u-cmklxchw@apply.theblackfemaleengineer.com",
  phone: "7206298925",
  usState: "Colorado",
  workAuthorized: true,
  needsSponsorship: false,
  countryOfResidence: "United States",
};

const resumeUrl = "https://7af79irdmlkxa8mq.public.blob.vercel-storage.com/resumes/cmkjad7op007l118884s0vsyu/NBere_DevEd_Resume.docx-skz5krfMDfr6U44TbSAkHWQqBzN4WC.pdf";

async function testOne(company: { name: string; url: string }): Promise<{ name: string; success: boolean; error?: string; steps: string[] }> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${company.name}`);
  console.log(`URL: ${company.url}`);
  console.log("=".repeat(60));

  const result = await applyToJob(
    company.url,
    applicant,
    resumeUrl,
    "N.Bere-AI-Engineer.pdf",
    "Software Engineer"
  );

  const status = result.success ? "SUCCESS" : "FAILED";
  console.log(`\n${company.name}: ${status}${result.error ? ` — ${result.error}` : ""}`);

  return {
    name: company.name,
    success: result.success,
    error: result.error,
    steps: result.steps || [],
  };
}

async function main() {
  console.log(`Testing ${COMPANIES.length} companies...\n`);

  const results: Array<{ name: string; success: boolean; error?: string; failedDropdowns: string[]; missingFields: string[] }> = [];

  for (const company of COMPANIES) {
    try {
      const result = await testOne(company);

      // Extract failed dropdowns and missing fields for pattern analysis
      const failedDropdowns = result.steps
        .filter(s => s.startsWith("Dropdown failed"))
        .map(s => s.replace(/^Dropdown failed /, "").split(":")[0]);

      const missingFields = result.steps
        .filter(s => s.includes("Submit did not result") || s.includes("validation errors"))
        .length > 0
          ? result.steps.filter(s => s.startsWith("Not visible:")).map(s => s.replace("Not visible: ", ""))
          : [];

      results.push({
        name: company.name,
        success: result.success,
        error: result.error,
        failedDropdowns,
        missingFields,
      });

      // Don't apply to more than needed — stop early if we have enough successes
      // (already have 5: Stripe, Coinbase, Figma x2, Databricks)
      const totalSuccesses = 5 + results.filter(r => r.success).length;
      if (totalSuccesses >= 20) {
        console.log(`\nReached 20 successful companies. Stopping.`);
        break;
      }
    } catch (err) {
      console.error(`${company.name}: CRASH — ${err}`);
      results.push({ name: company.name, success: false, error: String(err), failedDropdowns: [], missingFields: [] });
    }

    // Brief pause between companies
    await new Promise(r => setTimeout(r, 3000));
  }

  // Print summary
  console.log(`\n\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log("=".repeat(60));

  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);

  console.log(`\nSuccessful (${successes.length + 5}/20 total including Stripe, Coinbase, Figma x2, Databricks):`);
  for (const r of successes) {
    console.log(`  ✅ ${r.name}`);
  }

  console.log(`\nFailed (${failures.length}):`);
  for (const r of failures) {
    console.log(`  ❌ ${r.name}: ${r.error}`);
    if (r.failedDropdowns.length > 0) {
      console.log(`     Failed dropdowns: ${r.failedDropdowns.join(", ")}`);
    }
  }

  // Output pattern gaps for fixing
  const allFailedDropdowns = failures.flatMap(r => r.failedDropdowns);
  if (allFailedDropdowns.length > 0) {
    console.log(`\nDropdown patterns that need adding:`);
    for (const d of [...new Set(allFailedDropdowns)]) {
      console.log(`  - ${d}`);
    }
  }

  await closeBrowser();
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });

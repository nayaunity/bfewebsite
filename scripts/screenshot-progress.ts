import puppeteer from "puppeteer-core";
import fs from "fs";

const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
  :root {
    --background: #faf9f7;
    --foreground: #111;
    --card-bg: #fff;
    --card-border: #e5e5e5;
    --gray-50: #fafafa;
    --gray-100: #f0f0f0;
    --gray-200: #e5e5e5;
    --gray-600: #6b7280;
    --gray-800: #1f2937;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--background);
    color: var(--foreground);
    padding: 24px 40px;
  }

  .page-header { margin-bottom: 28px; }
  .breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gray-600); margin-bottom: 6px; }
  .breadcrumb .current { color: var(--foreground); }
  h1 { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; }
  .subtitle { font-size: 13px; color: var(--gray-600); margin-top: 4px; }

  /* Stats row */
  .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 16px;
    padding: 18px 20px;
  }
  .stat-label { font-size: 12px; color: var(--gray-600); margin-bottom: 4px; }
  .stat-value { font-size: 24px; font-weight: 600; }
  .stat-sub { font-size: 11px; color: var(--gray-600); margin-top: 2px; }

  /* Today's Auto-Apply card */
  .card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 24px;
  }
  .card-header {
    padding: 14px 20px;
    border-bottom: 1px solid var(--card-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-header-left { display: flex; align-items: center; gap: 8px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot-blue { background: #3b82f6; animation: pulse 2s infinite; }
  .dot-green { background: #22c55e; }
  .card-title { font-size: 14px; font-weight: 600; }
  .card-stats { display: flex; gap: 16px; font-size: 12px; color: var(--gray-600); }
  .card-stats .green { color: #16a34a; font-weight: 500; }
  .card-body { padding: 20px; }

  /* Progress bar */
  .progress-wrap { margin-bottom: 20px; }
  .progress-labels { display: flex; justify-content: space-between; font-size: 12px; color: var(--gray-600); margin-bottom: 6px; }
  .progress-labels .pct { font-weight: 500; }
  .progress-track { width: 100%; height: 8px; background: var(--gray-100); border-radius: 999px; overflow: hidden; }
  .progress-fill { height: 100%; background: #3b82f6; border-radius: 999px; transition: width 0.7s; }

  /* Steps */
  .steps { display: flex; flex-direction: column; gap: 12px; }
  .step { display: flex; align-items: center; gap: 12px; }
  .step-icon {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .step-icon.done { background: #dcfce7; }
  .step-icon.active { background: #dbeafe; }
  .step-icon.pending { background: var(--gray-100); }
  .step-icon svg { width: 14px; height: 14px; }
  .pulse-dot { width: 10px; height: 10px; border-radius: 50%; background: #3b82f6; animation: pulse 2s infinite; }
  .gray-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(107,114,128,0.3); }
  .step-label { font-size: 14px; }
  .step-label.done { color: #15803d; }
  .step-label.active { color: var(--foreground); font-weight: 500; }
  .step-label.pending { color: var(--gray-600); }
  .hint { margin-top: 16px; text-align: center; font-size: 12px; color: var(--gray-600); }

  /* Complete row */
  .complete-row { display: flex; align-items: center; gap: 12px; }
  .complete-icon {
    width: 32px; height: 32px; border-radius: 50%; background: #dcfce7;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .complete-icon svg { width: 16px; height: 16px; }
  .complete-title { font-size: 14px; font-weight: 500; }
  .complete-sub { font-size: 12px; color: var(--gray-600); margin-top: 2px; }

  .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--gray-600); font-weight: 600; margin-bottom: 12px; margin-top: 20px; }

  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
</head>
<body>

<!-- Page Header -->
<div class="page-header">
  <div class="breadcrumb">
    <span>Home</span><span>/</span><span>Profile</span><span>/</span><span class="current">Applications</span>
  </div>
  <h1>Welcome back, Kasey</h1>
  <p class="subtitle">Track and manage your auto-applied job applications</p>
</div>

<!-- Stats Row -->
<div class="stats-row">
  <div class="stat-card">
    <div class="stat-label">Total Applications</div>
    <div class="stat-value">12</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Submitted</div>
    <div class="stat-value" style="color: #16a34a;">8</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Unique Companies</div>
    <div class="stat-value">6</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Usage This Month</div>
    <div class="stat-value">8 / 30</div>
    <div class="stat-sub">Starter plan</div>
  </div>
</div>

<!-- STATE 1: Active session (mid-scan) -->
<div class="section-label">What users see while auto-apply is running</div>
<div class="card">
  <div class="card-header">
    <div class="card-header-left">
      <div class="dot dot-blue"></div>
      <span class="card-title">Today's Auto-Apply</span>
    </div>
  </div>
  <div class="card-body">
    <div class="progress-wrap">
      <div class="progress-labels">
        <span>Progress</span>
        <span class="pct">40%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: 40%"></div>
      </div>
    </div>
    <div class="steps">
      <div class="step">
        <div class="step-icon active"><div class="pulse-dot"></div></div>
        <span class="step-label active">Scanning companies... 8 of 20 checked</span>
      </div>
      <div class="step">
        <div class="step-icon pending"><div class="gray-dot"></div></div>
        <span class="step-label pending">Waiting to match your profile to open positions</span>
      </div>
      <div class="step">
        <div class="step-icon pending"><div class="gray-dot"></div></div>
        <span class="step-label pending">Tailoring your resume for each matching role</span>
      </div>
    </div>
    <p class="hint">This usually takes a few minutes. You can leave this page and come back.</p>
  </div>
</div>

<!-- STATE 2: Active session (scan done, applying) -->
<div class="section-label">After scanning is complete, applying</div>
<div class="card">
  <div class="card-header">
    <div class="card-header-left">
      <div class="dot dot-blue"></div>
      <span class="card-title">Today's Auto-Apply</span>
    </div>
  </div>
  <div class="card-body">
    <div class="progress-wrap">
      <div class="progress-labels">
        <span>Progress</span>
        <span class="pct">100%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: 100%"></div>
      </div>
    </div>
    <div class="steps">
      <div class="step">
        <div class="step-icon done">
          <svg style="color: #16a34a" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <span class="step-label done">Scanned 20 companies</span>
      </div>
      <div class="step">
        <div class="step-icon done">
          <svg style="color: #16a34a" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <span class="step-label done">Found 4 matching roles</span>
      </div>
      <div class="step">
        <div class="step-icon active"><div class="pulse-dot"></div></div>
        <span class="step-label active">Tailoring your resume and submitting applications... 2 sent</span>
      </div>
    </div>
    <p class="hint">This usually takes a few minutes. You can leave this page and come back.</p>
  </div>
</div>

<!-- STATE 3: Completed -->
<div class="section-label">After session finishes</div>
<div class="card">
  <div class="card-header">
    <div class="card-header-left">
      <div class="dot dot-green"></div>
      <span class="card-title">Today's Auto-Apply</span>
    </div>
    <div class="card-stats">
      <span>4 found</span>
      <span class="green">3 applied</span>
    </div>
  </div>
  <div class="card-body">
    <div class="complete-row">
      <div class="complete-icon">
        <svg style="color: #16a34a" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <div>
        <p class="complete-title">Today's session complete</p>
        <p class="complete-sub">3 applications submitted across 3 companies</p>
      </div>
    </div>
  </div>
</div>

<!-- STATE 4: No matches -->
<div class="section-label">If no matching roles found</div>
<div class="card">
  <div class="card-header">
    <div class="card-header-left">
      <div class="dot dot-green"></div>
      <span class="card-title">Today's Auto-Apply</span>
    </div>
    <div class="card-stats">
      <span>0 found</span>
      <span class="green">0 applied</span>
    </div>
  </div>
  <div class="card-body">
    <div class="complete-row">
      <div class="complete-icon">
        <svg style="color: #16a34a" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <div>
        <p class="complete-title">Today's session complete</p>
        <p class="complete-sub">No matching roles found today. We scan again tomorrow at 3am MT.</p>
      </div>
    </div>
  </div>
</div>

</body>
</html>`;

async function main() {
  const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1600 });

  fs.writeFileSync("/tmp/progress-preview.html", html);
  await page.goto("file:///tmp/progress-preview.html", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: "/tmp/progress-stepper-final.png", fullPage: true });

  console.log("Screenshot saved to /tmp/progress-stepper-final.png");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import type { Metadata } from "next";
import React from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CopyableCodeBlock from "@/components/blog/CopyableCodeBlock";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import LifeStartupPageViewTracker from "./PageViewTracker";

export const metadata: Metadata = {
  title: "Life as a Startup: The Obsidian + Claude + Wisprflow Data System | The Black Female Engineer",
  description:
    "Companion tutorial for the \"I run my life like an AI startup\" video. Part 1: how to store the data. Part 2: how to actually retrieve it.",
  robots: {
    index: false,
    follow: false,
  },
};

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-sm bg-[var(--gray-100)] px-1.5 py-0.5 rounded break-words">
      {children}
    </code>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--accent)] underline"
    >
      {children}
    </a>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-2xl md:text-3xl mt-12 mb-4 text-[var(--foreground)]">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-serif text-xl md:text-2xl mt-8 mb-3 text-[var(--foreground)]">
      {children}
    </h3>
  );
}

function H4({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-semibold text-lg mt-6 mb-3 text-[var(--foreground)]">{children}</h4>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[var(--foreground)] mb-4 leading-relaxed">{children}</p>;
}

const vaultTree = `Blueprint/
├── CLAUDE.md                 ← instructions Claude reads every time it opens the folder
├── 0 - Daily Notes/          ← YYYY-MM-DD.md, one per day, raw input lands here
├── 01 Life OS/               ← Goals, Journal, Decisions, Future You, Health and Wellness
├── 02 Content Engine/        ← Instagram, TikTok, YouTube, Newsletter, Podcast, SOPs
├── 03 Learning/              ← AI Engineering, Oxford, Books, Research
├── 04 Business/              ← Revenue, Brand Deals, Partnerships/, Products/
├── 05 Ideas/                 ← Startup Ideas, Content Ideas, Experiments
├── 06 Resources/             ← People, Quotes, Articles
└── 07 Proof/                 ← Highlight Reel, Money & Business, Praise & Receipts, ...`;

const folderSetup = `cd ~/Documents/Blueprint
mkdir "0 - Daily Notes" "01 Life OS" "03 Learning" "05 Ideas" "06 Resources" "07 Proof"
mkdir -p "02 Content Engine/Instagram" "04 Business/Partnerships" "04 Business/Products"
touch CLAUDE.md`;

const gitSetup = `cd ~/Documents/Blueprint
git init
echo ".obsidian/workspace.json" > .gitignore
git add . && git commit -m "init vault"
gh repo create blueprint --private --source=. --push`;

const claudeMd = `# Blueprint - Personal Knowledge Base

## First Rule

Always search this project directory first before using web search or any
external resource. The user's notes, daily journals, and files in this folder
are the primary source of truth. Only go external if the answer isn't found here.

## Structure

- \`0 - Daily Notes/\` - Daily journal entries (YYYY-MM-DD.md format)
- \`01 Life OS/\` - Personal systems and life management
- \`02 Content Engine/\` - Content creation and strategy
- \`03 Learning/\` - Learning notes and resources
- \`04 Business/\` - Business ideas and plans
- \`05 Ideas/\` - Idea capture
- \`06 Resources/\` - Reference materials
- \`07 Proof/\` - Evidence of wins, praise, and milestones`;

const extractorPrompt = `You are an automation agent for an Obsidian vault ("Blueprint"). Your job is to read one or more daily notes and extract their content into the correct files across the vault. Normally you run nightly just after midnight and process the previous day's note, but you can also be run on demand for specific dates.

## Target Date(s)

Determine which daily note(s) to process:

1. Search ALL of the instructions and messages you were given for a line of the form \`DATES: YYYY-MM-DD\` (one or more comma-separated dates, e.g. \`DATES: 2026-08-14, 2026-08-15\`). If such a line exists, those dates are your targets.
2. If no \`DATES:\` line exists, your single target is yesterday. Determine it by running \`date -d 'yesterday' +%Y-%m-%d\` (or \`date -v-1d +%Y-%m-%d\` on macOS).

## Vault Structure

\`\`\`
0 - Daily Notes/          - Daily journal entries, named YYYY-MM-DD.md
01 Life OS/               - Goals.md, Journal.md, Future You.md, Decisions.md, Health and Wellness.md
02 Content Engine/
   Instagram/             - 300K Followers.md, Content Direction.md, Active Pipeline.md, Hook Bank.md, Audience Insights.md
   Newsletter/
   TikTok/
   YouTube/
   Podcast/
   Content Batching SOP.md
03 Learning/              - AI Engineering.md, Oxford.md, Books.md, Research.md
04 Business/
   Revenue.md
   Brand Deals.md
   Products/              - App - 20K MRR by Dec 2026.md, AI Dream Life Starter Kit.md
   Partnerships/          - One note per agency (e.g., Knight Media.md)
05 Ideas/                 - Startup Ideas.md, Content Ideas.md, Experiments.md
06 Resources/             - Articles.md, People.md, Quotes.md, Media Template.md
\`\`\`

## Your Task

For EACH target date (process them in chronological order):

1. Check if \`0 - Daily Notes/<date>.md\` exists. If it does not exist, log "No daily note found for <date>" and skip that date. If none of the target dates have a note, stop.
2. Read the daily note in full.
3. Extract content and append it to the correct files using these routing rules:

   - **Content ideas, hooks, video concepts** → \`02 Content Engine/Instagram/Hook Bank.md\` (or the relevant platform folder if the note specifies TikTok, YouTube, etc.)
   - **Audience insights, what's resonating, top-performing content** → \`02 Content Engine/Instagram/Audience Insights.md\`
   - **Active content being filmed/edited/posted** → \`02 Content Engine/Instagram/Active Pipeline.md\`
   - **Content strategy shifts or direction changes** → \`02 Content Engine/Instagram/Content Direction.md\`
   - **Partnership or agency meetings/contacts** → \`04 Business/Partnerships/\` - create a new note per agency if one doesn't exist, or update the existing one
   - **Brand deal info** → \`04 Business/Brand Deals.md\`
   - **Revenue or income updates** → \`04 Business/Revenue.md\`
   - **Product ideas or updates** → \`04 Business/Products/\`
   - **Goals** → \`01 Life OS/Goals.md\`
   - **Key decisions and reasoning** → \`01 Life OS/Decisions.md\`
   - **Personal reflections, gratitude, identity shifts** → \`01 Life OS/Journal.md\`
   - **Vision, future self, life design** → \`01 Life OS/Future You.md\`
   - **Health and wellness** → \`01 Life OS/Health and Wellness.md\`
   - **Learning, books, research** → \`03 Learning/\` (the appropriate sub-note)
   - **Startup or business ideas** → \`05 Ideas/Startup Ideas.md\`
   - **Experiment ideas** → \`05 Ideas/Experiments.md\`
   - **General content ideas not tied to a platform** → \`05 Ideas/Content Ideas.md\`

4. If the daily note has no extractable content for a given bucket, skip that bucket entirely.

## Connections (Obsidian Graph View)

The author uses Obsidian's graph view to see how her thinking connects. Every extraction must weave the new content into that web using \`[[wikilinks]]\`:

- **Link back to the source daily note.** Every date header you add must include a link to the daily note it came from, e.g. \`**August 20, 2026** ([[2026-08-20]])\`. This connects every extracted insight back to its origin day in the graph.
- **Cross-link related notes.** When an entry touches a topic that lives in another vault note, link it with the note's exact filename (no .md), e.g. a decision about a brand deal links [[Brand Deals]]; a revenue update tied to a product links that product's note; a content idea that came from an audience insight links [[Audience Insights]].
- **Link people and orgs.** When a person or organization mentioned has their own note (e.g. an agency in \`04 Business/Partnerships/\`), link it. People without their own note can be linked as [[People]] mentions.
- **Use exact filenames.** Before writing a link, verify the target note exists (Glob/ls) and match its filename exactly so the link resolves. Only use a non-existent link target deliberately, when the concept clearly deserves its own future note.
- **Be genuine, not exhaustive.** Link where a real relationship exists in the content. Do not decorate every noun with brackets.
- **New notes join the web.** Any new note you create (e.g. a new partnership or product note) must contain at least one link to a related existing note and the source daily note, so it never appears as an isolated node.

## Rules

- **Preserve voice and substance.** Do not summarize away detail. Use the author's own words and phrasing as much as possible.
- **Append, don't overwrite.** Add new entries below existing content in each file.
- **Date markers.** Before each batch of new entries in a file, add a date header like \`**June 7, 2026** ([[2026-06-07]])\` using the date of the daily note the content came from, so the author can see when things were added and can jump to the source note.
- **No duplicates.** Read each target file before editing so you know where to append, and check whether that date's content was already extracted (a date header for that date already covering the same content). If a date was already fully extracted, skip it and log that it was skipped.
- **Do not modify the daily note itself.** It is read-only input.
- **Commit and push.** After all extractions, stage the changed files and commit. For a single date use the message: \`Extract daily note insights for YYYY-MM-DD\`. For multiple dates use: \`Extract daily note insights for YYYY-MM-DD, YYYY-MM-DD, ...\` listing each processed date. Then push to origin.

## Now run the extraction for the target date(s).`;

const patternQueries = [
  `Across all daily notes since June 1, how many days did I mention feeling
exhausted vs. energized? Table by week. What was different about the
energized days (sleep, schedule, who I spoke to)?`,
  `List every money number I've said out loud in the last 60 days with the date
and the file it's filed in. Flag any commitment I made and haven't mentioned since.`,
  `Which decisions in Decisions.md have I later reversed or complained about in
a daily note? Quote both.`,
  `Read 07 Proof/. What categories are thin? What kind of win am I not logging?`,
];

const voiceBlock = `Same voice as her daily ops manager: encouraging, direct but kind.
NEVER assertive or aggressive. You are reflecting WITH her, not grading her.
- Start with "Happy Friday" + a warm environment emoji (vary weekly) + the date range analyzed
- All emojis depicting people MUST use :skin-tone-5:
- End with a motivating (but not corny) quote. Vary weekly.
- Synthesize and reflect, do not parrot back private details.`;

const slackDelivery = `cat > /tmp/slack_msg.json << 'JSONEOF'
{"channel": "<YOUR_SLACK_USER_ID>", "text": "YOUR_COMPOSED_MESSAGE_HERE"}
JSONEOF
curl -s -X POST 'https://slack.com/api/chat.postMessage' \\
  -H 'Authorization: Bearer <SLACK_BOT_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -d @/tmp/slack_msg.json`;

const decisionBrief = `I'm about to <event>. Pull everything relevant from this vault: prior decisions,
numbers I've committed to, what the other party has said before (check
Partnerships/), and anything in Proof/ I should remember about my own leverage.
Give me a one-page brief with dates and source links.`;

const tableWrap = "overflow-x-auto rounded-2xl border border-[var(--card-border)] mb-6";
const th = "px-4 py-3 font-semibold text-[var(--foreground)] align-top";
const td = "px-4 py-3 text-[var(--foreground)] align-top";

const checklist = [
  "Tools installed: Obsidian, Claude Code (paid Claude plan), Wisprflow, Granola, git + gh (Step 0)",
  "Obsidian vault with 0 - Daily Notes/ + numbered bucket folders",
  "Daily Notes plugin pointed at 0 - Daily Notes",
  "git init, private GitHub repo, GitHub Sync plugin at 5 min",
  "CLAUDE.md with the \"search this folder first\" rule and the folder map",
  "Wisprflow hotkey working inside Obsidian",
  "Granola on every important call; takeaways + link pasted into the daily note",
  "/schedule the Daily Note Extractor at 3am (your time) with the prompt above; Run now with DATES: on an old note to verify",
  "Backfill every existing daily note with a DATES: run",
  "/schedule the weekly Friday synthesis (then monthly/quarterly when you have the history)",
  "Ask the vault one question tomorrow morning",
];

export default function LifeAsAStartupPage() {
  return (
    <>
      <PagePresenceTracker page="skool-life-as-a-startup" />
      <LifeStartupPageViewTracker />
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--cta-bg)] text-white font-medium">
              AI Income Lab
            </span>
            <span className="text-sm text-[var(--gray-600)]">
              Members only. Please don't share this link.
            </span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-4 text-[var(--foreground)]">
            Life as a Startup: The{" "}
            <span className="italic text-[var(--accent)]">Obsidian + Claude + Wisprflow</span>{" "}
            Data System
          </h1>
          <p className="text-lg text-[var(--gray-600)] italic mb-8 pb-8 border-b border-[var(--card-border)]">
            Companion tutorial for the "I run my life like an AI startup" video. Part 1 is
            how to store the data. Part 2 is how to actually retrieve it.
          </p>

          <P>
            This is the exact system running in this vault (the{" "}
            <InlineCode>Blueprint</InlineCode> folder): the folder structure, the git sync,
            the CLAUDE.md rule, the nightly cloud routine that files each day's raw
            brain-dump into dated buckets (the real prompt is below, verbatim), and the
            weekly/monthly/quarterly/yearly routines that read it all back.
          </P>

          <H2>The stack (3 tools)</H2>
          <div className={tableWrap}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[var(--gray-50)]">
                  <th className={th}>Role</th>
                  <th className={th}>Tool</th>
                  <th className={th}>What it does here</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Data warehouse</td>
                  <td className={`${td} whitespace-nowrap`}>
                    <ExtLink href="https://obsidian.md">Obsidian</ExtLink>
                  </td>
                  <td className={td}>
                    A folder of plain markdown files. One file per day, plus "bucket" files
                    per topic. Nothing proprietary. Claude can read/write it like any code
                    repo.
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Data analyst</td>
                  <td className={`${td} whitespace-nowrap`}>
                    <ExtLink href="https://claude.com/claude-code">Claude Code</ExtLink>
                  </td>
                  <td className={td}>
                    Runs in the vault folder. Nightly: reads the day's note and files it
                    into buckets. On demand: answers questions from your own history.
                    Weekly: cloud routine sends a synthesis.
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Data collector</td>
                  <td className={`${td} whitespace-nowrap`}>
                    <ExtLink href="https://wisprflow.ai">Wisprflow</ExtLink> (+{" "}
                    <ExtLink href="https://go.granola.ai/naya-bere">Granola</ExtLink>)
                  </td>
                  <td className={td}>
                    Wisprflow turns every voice note / end-of-day brain-dump into text.
                    Granola records calls and produces a transcript + summary. Both get
                    pasted into the daily note.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <P>
            The whole point: <strong className="font-semibold">you never type. You talk,
            and it lands as text in one dated file.</strong> A cloud routine does the
            sorting at 3am; four more routines do the reflecting weekly → yearly.
          </P>

          {/* PART 1 */}
          <div className="mt-14 pt-8 border-t-2 border-[var(--accent)]">
            <h2 className="font-serif text-3xl md:text-4xl mb-4 text-[var(--foreground)]">
              Part 1: <span className="italic text-[var(--accent)]">Storing</span> the data
            </h2>
          </div>

          <H3>Step 0. Install the tools (15 minutes, one time)</H3>
          <P>Everything in this tutorial builds on these. Install them all up front:</P>
          <div className={tableWrap}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[var(--gray-50)]">
                  <th className={th}>Tool</th>
                  <th className={th}>Get it</th>
                  <th className={th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Obsidian</td>
                  <td className={td}>
                    <ExtLink href="https://obsidian.md">obsidian.md</ExtLink>
                  </td>
                  <td className={td}>
                    Free. Download the desktop app for Mac or Windows. The mobile app is
                    optional but nice for reading on the go.
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Claude Code</td>
                  <td className={td}>
                    <ExtLink href="https://claude.com/claude-code">
                      claude.com/claude-code
                    </ExtLink>
                  </td>
                  <td className={td}>
                    Needs a paid Claude plan (Pro or Max). Install the CLI with{" "}
                    <InlineCode>npm install -g @anthropic-ai/claude-code</InlineCode>, then
                    run <InlineCode>claude</InlineCode> in any folder and sign in. The
                    cloud routines live at{" "}
                    <ExtLink href="https://claude.ai/code">claude.ai/code</ExtLink>.
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Wisprflow</td>
                  <td className={td}>
                    <ExtLink href="https://wisprflow.ai">wisprflow.ai</ExtLink>
                  </td>
                  <td className={td}>
                    Voice-to-text dictation that works in any app. Free tier to start;
                    paid for unlimited dictation.
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Granola</td>
                  <td className={td}>
                    <ExtLink href="https://go.granola.ai/naya-bere">granola.ai</ExtLink>
                  </td>
                  <td className={td}>
                    AI call recorder. Optional but strongly recommended if calls are part
                    of your work. Free trial, then paid.
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>
                    GitHub + gh CLI
                  </td>
                  <td className={td}>
                    <ExtLink href="https://github.com">github.com</ExtLink> ·{" "}
                    <ExtLink href="https://cli.github.com">cli.github.com</ExtLink>
                  </td>
                  <td className={td}>
                    Free account (private repos included). On Mac:{" "}
                    <InlineCode>brew install gh</InlineCode> then{" "}
                    <InlineCode>gh auth login</InlineCode>. If git itself isn't installed,
                    macOS will prompt you the first time you run{" "}
                    <InlineCode>git</InlineCode> (or run{" "}
                    <InlineCode>xcode-select --install</InlineCode>).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <H3>Step 1. Build the vault (10 minutes)</H3>
          <P>
            A vault is just a folder on your computer that Obsidian watches. Mine is
            called <InlineCode>Blueprint</InlineCode>. Set it up like this:
          </P>
          <ol className="list-decimal ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              Open Obsidian. On the welcome screen choose{" "}
              <strong className="font-semibold">Create new vault</strong>, name it{" "}
              <InlineCode>Blueprint</InlineCode>, and set the location to{" "}
              <InlineCode>~/Documents</InlineCode>. (Already using Obsidian? Any vault
              works. The folder names are the only thing the automation cares about.)
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Create the folder structure. Either right-click in Obsidian's file sidebar
              and choose <strong className="font-semibold">New folder</strong> for each,
              or paste this into Terminal:
            </li>
          </ol>
          <CopyableCodeBlock code={folderSetup} />
          <P>The structure that has held up for 3 months:</P>
          <CopyableCodeBlock code={vaultTree} />
          <ol className="list-decimal ml-6 mb-4" start={3}>
            <li className="text-[var(--foreground)] mb-2">
              Turn on daily notes: <strong className="font-semibold">Settings (gear
              icon) → Core plugins → Daily notes</strong> → toggle it on. Then open{" "}
              <strong className="font-semibold">Daily notes</strong> in the sidebar of
              Settings and set <strong className="font-semibold">New file location</strong>{" "}
              to <InlineCode>0 - Daily Notes</InlineCode>. Leave the date format as{" "}
              <InlineCode>YYYY-MM-DD</InlineCode>. (This writes the{" "}
              <InlineCode>{"{\"folder\": \"0 - Daily Notes\"}"}</InlineCode> setting into{" "}
              <InlineCode>.obsidian/daily-notes.json</InlineCode> for you.)
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Give it a hotkey: <strong className="font-semibold">Settings → Hotkeys</strong>{" "}
              → search "daily" → assign <InlineCode>Cmd+D</InlineCode> to{" "}
              <strong className="font-semibold">Daily notes: Open today's daily note</strong>.
              Now Cmd+D (or the calendar icon in the left ribbon) opens today's file from
              anywhere.
            </li>
          </ol>
          <P>Two rules that make this work:</P>
          <ol className="list-decimal ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              <strong className="font-semibold">Daily notes are append-only raw input.</strong>{" "}
              You never organize inside them. They're the "event log".
            </li>
            <li className="text-[var(--foreground)] mb-2">
              <strong className="font-semibold">
                Bucket files are dated, newest-at-bottom (or top, pick one) entries.
              </strong>{" "}
              Every entry starts with a bold date, e.g.{" "}
              <InlineCode>**August 22, 2026**</InlineCode>. That date stamp is what makes
              retrieval possible later.
            </li>
          </ol>
          <H3>Step 2. Put the vault in git and push it to GitHub</H3>
          <P>
            This matters for two reasons: it's your backup, and it lets a{" "}
            <strong className="font-semibold">cloud</strong> Claude routine read the vault
            while your laptop is asleep.
          </P>
          <P>
            With git and the <InlineCode>gh</InlineCode> CLI installed and signed in
            (Step 0), run this in Terminal. It creates a{" "}
            <strong className="font-semibold">private</strong> GitHub repo and pushes the
            vault to it:
          </P>
          <CopyableCodeBlock code={gitSetup} />
          <P>
            Then install the <strong className="font-semibold">GitHub Sync</strong>{" "}
            community plugin so Obsidian keeps pushing automatically:
          </P>
          <ol className="list-decimal ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              <strong className="font-semibold">Settings → Community plugins</strong> →{" "}
              <strong className="font-semibold">Turn on community plugins</strong> (Obsidian
              ships with them off).
            </li>
            <li className="text-[var(--foreground)] mb-2">
              <strong className="font-semibold">Browse</strong> → search{" "}
              <InlineCode>GitHub Sync</InlineCode> →{" "}
              <strong className="font-semibold">Install</strong> →{" "}
              <strong className="font-semibold">Enable</strong>.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Open the plugin's settings and configure:
              <ul className="list-disc ml-6 mt-2">
                <li className="text-[var(--foreground)] mb-2">
                  Remote URL:{" "}
                  <InlineCode>{"https://github.com/<you>/blueprint"}</InlineCode>
                </li>
                <li className="text-[var(--foreground)] mb-2">
                  Sync interval: <InlineCode>5</InlineCode> minutes
                </li>
                <li className="text-[var(--foreground)] mb-2">Sync on load: on</li>
              </ul>
            </li>
          </ol>
          <P>
            If the plugin asks for authentication (or pushes fail), create a personal
            access token at{" "}
            <ExtLink href="https://github.com/settings/tokens">
              github.com/settings/tokens
            </ExtLink>{" "}
            with repo access and use it in the remote URL:{" "}
            <InlineCode>{"https://<token>@github.com/<you>/blueprint.git"}</InlineCode>.
          </P>
          <P>
            That's why my commit log looks like{" "}
            <InlineCode>Nyaradzos-MacBook-Air.local 2026-8-24:13:21:53</InlineCode> every 5
            minutes. The plugin is auto-committing the daily note as I dictate into it.
            Zero manual commits.
          </P>

          <H3>Step 3. Write the CLAUDE.md (the most important file)</H3>
          <P>
            Claude Code reads <InlineCode>CLAUDE.md</InlineCode> in the folder it's
            launched from. This file is what turns a generic assistant into{" "}
            <em>your</em> analyst. Open the empty <InlineCode>CLAUDE.md</InlineCode> that
            the Step 1 script created (any text editor works, or Obsidian itself) and
            paste this in, swapping the folder map for yours. Here is mine, verbatim:
          </P>
          <CopyableCodeBlock code={claudeMd} />
          <P>
            To use it: open Terminal, <InlineCode>cd ~/Documents/Blueprint</InlineCode>,
            run <InlineCode>claude</InlineCode>. It picks up CLAUDE.md automatically every
            session.
          </P>
          <P>
            Why the "First Rule" exists: the first time I asked Claude "what were the goals
            I wanted to discuss with my manager?" it went to the web. I typed "bruh check
            the folder you're in", then had it write this file so it never happens again.
            Add the rule on day one.
          </P>

          <H3>Step 4. Collect the data (Wisprflow + Granola)</H3>
          <P>
            <strong className="font-semibold">
              <ExtLink href="https://wisprflow.ai">Wisprflow</ExtLink>
            </strong>{" "}
            (voice → text, system-wide dictation):
          </P>
          <ul className="list-disc ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              Install the desktop app, grant the microphone and accessibility permissions
              it asks for (System Settings → Privacy &amp; Security on Mac), and set the
              hold-to-talk hotkey in its preferences.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Use it <em>inside Obsidian's daily note</em>. Hold key, talk, release. The
              transcript drops in at the cursor.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Voice notes to friends: dictate them with Wisprflow in the messaging app,
              then paste the same text into the daily note. (Or just dictate the thought
              straight into the note first and paste it <em>out</em> to the friend. Same
              result, one less step.)
            </li>
            <li className="text-[var(--foreground)] mb-2">
              End of day: open today's note, hold the key, and brain-dump for 3 to 10
              minutes. Don't structure it. Don't fix the "likes" and "ums". Raw is fine.
              The raw notes in this vault look like <em>"OK, today's the first day in a
              long time where I'm not ending the day feeling exhausted and that's like not
              totally…"</em> Claude handles it.
            </li>
          </ul>
          <P>
            <strong className="font-semibold">
              <ExtLink href="https://go.granola.ai/naya-bere">Granola</ExtLink>
            </strong>{" "}
            (call recorder):
          </P>
          <ul className="list-disc ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              Install the app and connect your calendar. It records from your computer's
              audio, so nothing joins the call as a bot.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Run it on every call that touches business, money, health, or a mentor
              conversation.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              After the call, paste Granola's summary/key takeaways into the daily note
              under a heading like <InlineCode>I spoke with Jovonne at length today. Here
              are the key takeaways:</InlineCode> and include the transcript link{" "}
              (<InlineCode>Chat with meeting transcript: https://notes.granola.ai/t/...</InlineCode>).
              Bucket files then link back to that transcript, so a month later "why did I
              decide to leave the agency?" traces to the exact call.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Granola also has an MCP connector for Claude, so the automation can pull the
              full transcript itself if only the link is in the note.
            </li>
          </ul>
          <P>
            By 11pm the daily note is a messy, dated pile of: voice notes, call takeaways,
            a brain-dump, maybe a screenshot of praise from a DM. That's the input. Don't
            touch it.
          </P>

          <H3>Step 5. The Claude automation: "Daily Note Extractor" (the part everyone asks for)</H3>

          <H4>Where it actually runs</H4>
          <P>
            Not on the laptop. It's a{" "}
            <strong className="font-semibold">Claude Code cloud routine</strong>{" "}
            (<ExtLink href="https://claude.ai/code">claude.ai/code</ExtLink> → Routines).
            Anthropic spins up a sandbox, clones the vault's
            GitHub repo, runs the prompt, commits, pushes, and shuts down. The laptop can
            be closed. Mine has run 30 for 30 since Jun 8.
          </P>
          <P>The real configuration:</P>
          <div className={tableWrap}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[var(--gray-50)]">
                  <th className={th}>Setting</th>
                  <th className={th}>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Name</td>
                  <td className={td}>Daily Note Extractor</td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Trigger</td>
                  <td className={td}>
                    cron <InlineCode>3 2 * * *</InlineCode> (UTC) ={" "}
                    <strong className="font-semibold">3:03 AM London</strong>, daily
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Source</td>
                  <td className={td}>
                    <InlineCode>{"github.com/<you>/blueprint"}</InlineCode> (private)
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Model</td>
                  <td className={td}>
                    Sonnet 4.6 (cheap, and this is a filing task; no need for Opus)
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Allowed tools</td>
                  <td className={td}>
                    <InlineCode>Bash, Read, Write, Edit, Glob, Grep</InlineCode>
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Connectors</td>
                  <td className={td}>
                    Granola, Gmail, Google Drive, Google Calendar, Notion, Canva, Gamma
                    (Granola is the one that matters; it lets the agent pull a call
                    transcript if the note only has the link)
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={`${td} font-semibold whitespace-nowrap`}>Notifications</td>
                  <td className={td}>off. The result shows up in the vault, not my phone.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <H4>What it does</H4>
          <ol className="list-decimal ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              Figures out the target date: yesterday by default, or any{" "}
              <InlineCode>DATES: 2026-08-14, 2026-08-15</InlineCode> line you pass when
              running it manually (that's how I backfilled June).
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Reads <InlineCode>{"0 - Daily Notes/<date>.md"}</InlineCode> in full.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Routes every piece of content to a bucket file using a fixed routing table
              (decisions → <InlineCode>Decisions.md</InlineCode>, money →{" "}
              <InlineCode>Revenue.md</InlineCode>, hooks →{" "}
              <InlineCode>Hook Bank.md</InlineCode>, a call with an agency →{" "}
              <InlineCode>{"Partnerships/<Agency>.md"}</InlineCode>, etc.).
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Prefixes each batch with a date header that links back to the source note:{" "}
              <InlineCode>**August 20, 2026** ([[2026-08-20]])</InlineCode>. That one line
              is what makes Part 2 possible. Every insight is dated <em>and</em> one click
              from the raw day it came from.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Adds <InlineCode>[[wikilinks]]</InlineCode> to related notes/people so the
              Obsidian graph view shows the web. Verifies the target file exists before
              linking so links resolve.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Never edits the daily note. Append-only into buckets. Skips a date it
              already processed (no duplicates).
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Commits <InlineCode>Extract daily note insights for YYYY-MM-DD</InlineCode>{" "}
              and pushes. GitHub Sync pulls it into Obsidian before I wake up.
            </li>
          </ol>

          <H4>The exact prompt</H4>
          <P>
            Also saved in this vault as{" "}
            <InlineCode>.claude/commands/sort-daily.md</InlineCode>, so{" "}
            <InlineCode>/sort-daily DATES: 2026-08-24</InlineCode> runs the same thing
            locally. Swap the vault structure block and routing table for your own folders.
            That's the only part that's personal.
          </P>
          <CopyableCodeBlock code={extractorPrompt} />

          <H4>Setting it up (5 minutes)</H4>
          <ol className="list-decimal ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              Connect GitHub and any connectors at{" "}
              <ExtLink href="https://claude.ai/customize/connectors">
                claude.ai/customize/connectors
              </ExtLink>{" "}
              (Granola if you use it).
            </li>
            <li className="text-[var(--foreground)] mb-2">
              In Claude Code, run <InlineCode>/schedule</InlineCode> and say:{" "}
              <em>"Create a routine called Daily Note Extractor that runs every day at 3am
              London time against github.com/&lt;you&gt;/&lt;vault&gt;. Here are the
              instructions:"</em> and paste the prompt above. It'll convert your local time
              to UTC cron (<InlineCode>3 2 * * *</InlineCode> for me), default to Sonnet,
              and give you a <InlineCode>claude.ai/code/routines/trig_...</InlineCode> link.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Hit <strong className="font-semibold">Run now</strong> once with a{" "}
              <InlineCode>DATES:</InlineCode> line for an old note and diff the repo. If
              the buckets look right, you're done.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Backfill: run it manually with <InlineCode>DATES:</InlineCode> listing every
              existing daily note, oldest first.
            </li>
          </ol>
          <P>
            <strong className="font-semibold">Why cloud over a local cron:</strong> the
            first version of this was a "cron job at midnight", but a laptop that's asleep,
            closed in a bag, or on a plane means missed nights. A cloud routine plus a git
            repo has no such dependency. The only requirement is that GitHub Sync has
            pushed the day's note before 3am, which the 5-minute interval guarantees.
          </P>

          <H3>Step 6. What you wake up to</H3>
          <ul className="list-disc ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              <InlineCode>0 - Daily Notes/2026-08-21.md</InlineCode>: untouched raw dump.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              <InlineCode>01 Life OS/Decisions.md</InlineCode>: a new{" "}
              <InlineCode>**August 21, 2026** ([[2026-08-21]])</InlineCode> block with the
              decision and reasoning.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              <InlineCode>04 Business/Partnerships/Jovonne.md</InlineCode>: the call
              takeaways, linked to the Granola transcript.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              <InlineCode>02 Content Engine/Instagram/Hook Bank.md</InlineCode>: the hook I
              said out loud at 11pm.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Graph view: new edges from all of the above back to{" "}
              <InlineCode>2026-08-21</InlineCode>.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Git log: one commit,{" "}
              <InlineCode>Extract daily note insights for 2026-08-21</InlineCode>.
            </li>
          </ul>
          <P>That's a day's worth of data, structured, in ~2 minutes of talking.</P>
          <P>
            (The <InlineCode>07 Proof/</InlineCode> folder and the{" "}
            <InlineCode>Related:</InlineCode> footers on some daily notes came from manual
            Claude Code sessions in the vault, not the nightly routine. The routine's
            prompt predates Proof. Adding a Proof routing rule is the next edit.)
          </P>

          {/* PART 2 */}
          <div className="mt-14 pt-8 border-t-2 border-[var(--accent)]">
            <h2 className="font-serif text-3xl md:text-4xl mb-4 text-[var(--foreground)]">
              Part 2: <span className="italic text-[var(--accent)]">Retrieving</span> the
              data (storage is worthless without this)
            </h2>
          </div>
          <P>
            Most people who set up a second brain never read it again. The retrieval layer
            is the actual product. Four modes, in order of how often I use them.
          </P>

          <H3>Mode 1. Ask the vault (daily)</H3>
          <P>
            Open Claude Code in the vault and ask in plain English. Because of the
            CLAUDE.md rule, it searches your files first. Real prompts from this vault's
            history:
          </P>
          <ul className="list-disc ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              <em>"I have my meeting with my manager, Tatiana, about Q4 today. What were
              the goals and plans I had wanted to discuss with her?"</em>
            </li>
            <li className="text-[var(--foreground)] mb-2">
              <em>"What's the name of that MFM podcast guest that's investing in
              podcasters?"</em>
            </li>
            <li className="text-[var(--foreground)] mb-2">
              <em>"What did Jovonne tell me about the mental journey being missing from my
              content?"</em>
            </li>
          </ul>
          <P>
            Claude greps across daily notes and buckets, quotes the dated entries back,
            and links the source note. Treat it like asking a chief of staff who has read
            everything you've ever said.
          </P>
          <P>
            Tip: <strong className="font-semibold">name people and dates.</strong> "What
            did I decide about the editor in July?" retrieves far better than "what did I
            think about editors?" because the nightly sort stamped every entry with a date
            and <InlineCode>[[wikilinks]]</InlineCode> to people.
          </P>

          <H3>Mode 2. Pattern queries (weekly)</H3>
          <P>
            This is where 90 days of dated notes pay off. Ask questions a human couldn't
            answer from memory:
          </P>
          {patternQueries.map((q) => (
            <CopyableCodeBlock key={q.slice(0, 30)} code={q} />
          ))}
          <P>
            Ask for a table when the output is quantitative and a quoted list when it's
            qualitative. Have Claude write the answer to{" "}
            <InlineCode>01 Life OS/Reviews/YYYY-MM-DD Weekly Review.md</InlineCode> so the
            analysis becomes data too.
          </P>

          <H3>
            Mode 3. The reflection routines (automated: weekly, monthly, quarterly, yearly,
            birthday)
          </H3>
          <P>
            Same cloud-routine machinery as the extractor, pointed at <em>analysis</em>{" "}
            instead of filing. Five of them, all reading{" "}
            <InlineCode>0 - Daily Notes/</InlineCode> from the cloned repo and DMing me on
            Slack as "BFE Agent":
          </P>
          <div className={tableWrap}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[var(--gray-50)]">
                  <th className={th}>Routine</th>
                  <th className={th}>Cron (UTC)</th>
                  <th className={th}>Reads</th>
                  <th className={th}>Shape of the message</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={td}>
                    <InlineCode>weekly-blueprint-analysis</InlineCode>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <InlineCode>0 12 * * 5</InlineCode> (Fri 1pm London)
                  </td>
                  <td className={`${td} whitespace-nowrap`}>last 7 days</td>
                  <td className={td}>
                    This week in your head · Ideas worth holding onto · Goals check-in ·
                    Patterns I noticed · Something to sit with · quote. Under 2,000 chars.
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={td}>
                    <InlineCode>monthly-blueprint-analysis</InlineCode>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <InlineCode>0 12 1 * *</InlineCode>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>last calendar month</td>
                  <td className={td}>
                    Month at a glance · How your thinking evolved · Wins · Goals &
                    progress · The thread worth pulling · Looking ahead. Under 2,500 chars.
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={td}>
                    <InlineCode>quarterly-blueprint-analysis</InlineCode>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <InlineCode>0 12 1 1,4,7,10 *</InlineCode>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>last 3 months</td>
                  <td className={td}>
                    Quarter in three words · Strategic shifts · Ideas with staying power ·
                    Wins · Growth I see ·{" "}
                    <strong className="font-semibold">The big question</strong>. Under
                    3,000 chars.
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={td}>
                    <InlineCode>yearly-blueprint-analysis</InlineCode>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <InlineCode>0 13 1 1 *</InlineCode>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>Jan 1 to Dec 31</td>
                  <td className={td}>
                    Year in one sentence · Who you became · Ideas that shaped the year ·
                    Wins · Lessons earned · Looking ahead. Under 4,000 chars.
                  </td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className={td}>
                    <InlineCode>birthday-blueprint-reflection</InlineCode>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <InlineCode>0 12 12 7 *</InlineCode>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>birthday to birthday</td>
                  <td className={td}>A celebration first, analysis second.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <P>
            All five share a voice block and a delivery block. The voice block is the part
            worth copying:
          </P>
          <CopyableCodeBlock code={voiceBlock} />
          <P>
            Each one's Step 1 is the same: <em>"The repo is cloned into the working
            directory. Daily notes live in <InlineCode>0 - Daily Notes</InlineCode> and are
            named YYYY-MM-DD.md. Use Bash to find all files from the past N days and Read
            each one."</em> Step 2 is the analysis lens (see table). Step 3 is the message
            structure. Step 4 is delivery:
          </P>
          <CopyableCodeBlock code={slackDelivery} />
          <P>To get the two Slack values (5 minutes, one time):</P>
          <ol className="list-decimal ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              Create an app at{" "}
              <ExtLink href="https://api.slack.com/apps">api.slack.com/apps</ExtLink> →{" "}
              <strong className="font-semibold">Create New App → From scratch</strong>,
              pick your workspace.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Under <strong className="font-semibold">OAuth &amp; Permissions</strong>, add
              the bot scope <InlineCode>chat:write</InlineCode>, then{" "}
              <strong className="font-semibold">Install to Workspace</strong> and copy the{" "}
              <strong className="font-semibold">Bot User OAuth Token</strong> (starts with{" "}
              <InlineCode>xoxb-</InlineCode>).
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Your user ID: in Slack, click your profile photo →{" "}
              <strong className="font-semibold">Profile</strong> → the three-dot menu →{" "}
              <strong className="font-semibold">Copy member ID</strong> (starts with{" "}
              <InlineCode>U</InlineCode>). DMing your own member ID makes the message land
              as a DM from the bot.
            </li>
          </ol>
          <P>
            (If you'd rather not touch Slack, have the routine write the analysis to{" "}
            <InlineCode>01 Life OS/Reviews/YYYY-MM-DD.md</InlineCode> and commit. Then the
            analysis becomes data in the vault too.)
          </P>
          <P>
            The single most important instruction across all of them:{" "}
            <strong className="font-semibold">"Synthesize rather than parrot back."</strong>{" "}
            Without it you get a summary; with it you get the pattern. The quarterly one's
            "THE BIG QUESTION: one strategic question that emerged from the quarter's
            patterns. Not an answer, just the right question." is the highest-leverage
            section in the whole system.
          </P>
          <P>
            To create one: <InlineCode>/schedule</InlineCode> → describe the cadence, the
            lens, and where to send it → paste the voice block → confirm the UTC
            conversion.
          </P>

          <H3>Mode 4. Structured retrieval for real decisions (monthly / before big calls)</H3>
          <P>
            Before a negotiation, a manager 1:1, a quarterly plan, or a hard personal
            call, run a targeted brief:
          </P>
          <CopyableCodeBlock code={decisionBrief} />
          <P>
            This is the "founder runs on data" move. You walk in with your own history
            instead of vibes.
          </P>

          <H3>Retrieval hygiene (so it keeps working)</H3>
          <ul className="list-disc ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              <strong className="font-semibold">Keep the date stamps sacred.</strong> Every
              retrieval mode above depends on <InlineCode>**Month D, YYYY**</InlineCode>{" "}
              headers in bucket files and <InlineCode>YYYY-MM-DD.md</InlineCode> filenames.
              Never let the automation drop them.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              <strong className="font-semibold">Never delete from buckets.</strong>{" "}
              Reversed a decision? Add a new dated entry that says so. History is the
              asset.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              <strong className="font-semibold">Let Claude add links, not you.</strong>{" "}
              Wikilinks are what make "who said what when" traceable. Rule in the prompt:
              only link when it's genuinely useful.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              <strong className="font-semibold">Re-index Proof monthly.</strong> Ask Claude
              to re-read the last 30 days of daily notes and add anything that qualifies to{" "}
              <InlineCode>07 Proof/</InlineCode>. Wins get under-logged in the moment.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              <strong className="font-semibold">Search local first, always.</strong> If an
              answer isn't in the vault, that's a signal to <em>say more out loud
              tomorrow</em>, not to go to Google.
            </li>
          </ul>

          <H2>Quick-start checklist</H2>
          <ul className="list-none mb-6">
            {checklist.map((item) => (
              <li key={item} className="text-[var(--foreground)] mb-2 flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 w-4 h-4 shrink-0 rounded border border-[var(--card-border)]"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="text-sm text-[var(--gray-600)] pt-6 border-t border-[var(--card-border)]">
            Related: Content Batching SOP · Journal · Decisions · Highlight Reel · Jovonne
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}

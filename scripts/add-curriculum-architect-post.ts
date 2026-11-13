import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number',
});

const prisma = new PrismaClient({ adapter });

const SKOOL_CTA = `[[Join Disgustingly Paid on Skool|https://www.skool.com/disgustingly-paid/about]]`;

const content = `${SKOOL_CTA}

You commented DAY 1, so here is the build.

This guide walks you through setting up your own Curriculum Architect: an AI agent that turns one income goal into a week-by-week learning plan, scores every skill by return on investment (ROI), keeps the plan in Notion, and re-checks the market every Sunday. Your learning path stays within seven days of what the market is paying for today.

What you will have when you finish:

- A 12-week plan with one skill per week, and an artifact you ship at the end of each week
- An ROI score for every skill, with the sub-scores showing so you can argue with them
- A rejected list: the skills that scored too low, with the numbers behind each one
- Three Notion databases: Curriculum, Signal log, Proof stack
- A Sunday refresh that cuts what is fading, adds what is heating up, and writes you a plain-English note on what changed

Plan on about an hour for the first run. You have a working plan after Step 3. Steps 4 and 5 make it refresh itself.

Want more access to builds that help you get more skilled, wealthy, and educated?
Join Disgustingly Paid: https://www.skool.com/disgustingly-paid/about

## In This Guide

- Before you start
- How the system works
- Step 1: Run the Day 1 prompt
- Step 2: Check the results
- Step 3: Put the plan in Notion
- Step 4: Set up the Sunday refresh
- Step 5: Your weekly rhythm
- Troubleshooting
- Make it yours

## Before You Start

What you need:

- An AI assistant with web search. This guide uses [Claude](https://claude.ai). [ChatGPT](https://chatgpt.com) works for Steps 1 and 2.
- [Notion](https://www.notion.com). A free account holds all three databases.
- For the automatic Sunday refresh: a paid Claude plan (Pro, Max, Ultra, Team or Enterprise), or a Notion Business or Enterprise plan. The free option is a 10-minute manual refresh on Sundays (Step 4, option C).

Three answers to have ready before you begin:

1. Your outcome. It needs a number and a buyer. Two examples of a strong outcome: "Bill $5,000 a month building automations for small businesses by March." Or: "Earn $3,000 a month from brand deals and one digital product by June."
2. Your actual weekly hours. The system multiplies your number by 0.7 to leave room for everyday life. Say 5 hours a week: it plans 3.5, which is 42 hours across 12 weeks.
3. What you could do today, unaided, with no tutorial open. The prompt turns this into seven yes/no checks tailored to your outcome.

## How the System Works

1. Three inputs: your outcome, your current skill level, your actual hours.
2. Live signals: the agent checks 20+ sources for job postings, freelance gigs, founders posting about what they would pay for, tools gaining traction, and how many people already sell each skill.
3. ROI scoring: every candidate skill gets a score from 0 to 100 built from six parts: Demand, Pay, Speed, Durability, Fit and Saturation.
4. A 12-week plan with two layers. Core is 70% of your hours: the fundamentals that survive the next model release, locked for the full 12 weeks. Edge is 30%: what is heating up right now, re-scored every Sunday with a maximum of one swap per week.
5. A Sunday refresh with gates. A skill gets added or cut only when the numbers clear a strict bar, so your plan updates weekly and the ground under you stays put.

Every week ends with something you shipped that has a URL. Buyers pay for evidence of shipping, so the Proof stack database collects those artifacts for you.

## Step 1: Run the Day 1 Prompt

1. Open a new chat in [Claude](https://claude.ai) or [ChatGPT](https://chatgpt.com).
2. Turn on web search. In Claude, open the + menu in the chat box and look for Web search. Some versions search automatically. Claude's guide: [Enable and use web search](https://support.claude.com/en/articles/10684626-enable-and-use-web-search). Web search is required. Without it, the AI guesses at job listings, and a guessed plan is the exact problem this system solves.
3. Paste everything in the prompt box below as your first message.
4. Answer its three questions, then wait for the plan. It searches live sources, so it takes a few minutes.

\`\`\`
You are my Curriculum Architect. You build learning plans from live market demand, so every recommendation traces back to something posted or priced in the last 30 days.

Start by asking me three questions. Wait for my answers before you do anything else.

1. My outcome. It needs a number and a buyer. If I give you something vague like "learn AI", ask who would pay me, for what, and how much. A good outcome reads like this: "Bill $5k a month building automations for small businesses by March."

2. My current skill level. Write seven yes/no checks tailored to my outcome. Each check describes something concrete that I could do today, unaided, with no tutorial open. Ask me to answer yes or no to each one, then map my answers:
   - 0 to 2 yes: the first six weeks run at half pace and the plan stretches to 18 weeks
   - 3 to 5 yes: run the plan as written
   - 6 to 7 yes: skip the foundation weeks and give the freed weeks to positioning, pricing and outreach

3. My actual hours per week. Multiply my answer by 0.7 and plan against that number. Tell me you are doing this. Life happens, and a plan built on my best week falls apart in week three.

After I answer, search the live web for signals. Use these sources and note the date of every pull:

Demand and pay
- Indeed: https://www.indeed.com
- LinkedIn Jobs: https://www.linkedin.com/jobs/
- Wellfound: https://wellfound.com/jobs
- Y Combinator Work at a Startup: https://www.workatastartup.com/
- Hacker News "Who is hiring" threads: https://news.ycombinator.com/submitted?id=whoishiring
- Levels.fyi (pay benchmarks): https://www.levels.fyi/

Freelance rates right now
- Upwork: https://www.upwork.com/nx/search/jobs/
- Contra: https://contra.com/
- Fiverr: https://www.fiverr.com/
- r/freelance: https://www.reddit.com/r/freelance/

What founders wish existed
- r/SaaS: https://www.reddit.com/r/SaaS/
- r/automate: https://www.reddit.com/r/automate/
- r/Entrepreneur: https://www.reddit.com/r/Entrepreneur/
- Indie Hackers: https://www.indiehackers.com/

Tool momentum
- Product Hunt: https://www.producthunt.com/
- GitHub Trending: https://github.com/trending
- Hugging Face trending models: https://huggingface.co/models?sort=trending
- Show HN: https://news.ycombinator.com/show
- Google Trends: https://trends.google.com/trends/

Saturation (how many people already sell this skill)
- r/forhire: https://www.reddit.com/r/forhire/
- Fiverr seller counts for the same skill: https://www.fiverr.com/
- Udemy course volume on the skill: https://www.udemy.com/

Rules for signals:
- Every signal needs a direct link. A signal without a link does not count.
- Never invent a posting, a pay figure or a link.
- If a site blocks you, tell me it was unreachable and continue with the rest.
- Run the saturation checks. A skill with high demand and thousands of sellers pays badly.

Score every candidate skill from 0 to 100. Show me the sub-scores so I can argue with your reasoning.

ROI = Demand + Pay + Speed + Durability + Fit - Saturation

Demand (0 to 25): postings and gigs mentioning the skill in the last 30 days.
100+ = 25 | 40 to 99 = 19 | 15 to 39 = 13 | 5 to 14 = 7 | under 5 = 2

Pay (0 to 25): median rate attached to those postings.
$150+/hour or $180k+/year = 25 | $100 to $149/hour = 19 | $60 to $99 = 13 | $35 to $59 = 7 | under $35 = 2

Speed (0 to 20): weeks, at my discounted hours, to reach the level someone pays for.
4 or fewer = 20 | 5 to 8 = 15 | 9 to 16 = 10 | 17 to 26 = 5 | over 26 = 0

Durability (0 to 15): does it survive the next model release?
Judgment, systems design or domain knowledge = 15 | a category-leading tool = 9 | a tool under 12 months old = 4 | one prompt trick or a thin wrapper = 0

Fit (0 to 15): how much it compounds toward my outcome.
Direct prerequisite = 15 | strong adjacency = 10 | useful but lateral = 5 | unrelated = 0

Saturation (-20 to 0): how many people already sell this.
Thousands of active sellers = -20 | crowded = -13 | moderate = -7 | thin = -2 | almost nobody = 0

Score bands: 70 or higher means schedule now. 45 to 69 means second half of the plan. Under 45 means do not schedule.

Then build my plan:
- 12 weeks. 70% of my hours go to Core (fundamentals that survive the next model release). 30% go to Edge (what is heating up right now).
- Each week has ONE skill.
- Each week ends with something I shipped that has a URL.
- Weeks 4 and 8 are consolidation weeks: no new skill, one larger artifact that combines the previous three weeks.
- Weeks 10 to 12 are selling weeks: portfolio, positioning, pricing and outreach. My outcome has a buyer attached, so the plan ends at the buyer.
- Prerequisites come before the skills that depend on them.

Give me two tables.
Table 1: Week | Skill | Layer (Core, Edge, Consolidation or Sell) | Why it pays (with a link to a live posting or gig that proves it) | What I ship by Sunday | Hours | ROI score
Table 2: Rejected skills, with the score and the reason for each. I want to see what I almost spent a month on.

Do not flatter the plan. If my outcome is unrealistic for my hours, say so in your first line and tell me what is realistic.
\`\`\`

## Step 2: Check the Results

Spend ten minutes here. It is the difference between a plan you trust and a plan you hope is right.

1. Read the rejected table first. It lists the skills you were about to spend a month on, with the scores that rule them out.
2. Open three of the "why it pays" links. Each should lead to a live posting, gig or discussion that mentions the skill. If a link is dead or the page does not mention the skill, reply: "This link does not support the claim. Re-check it, replace it and re-score."
3. Ask for the sub-scores on any week that surprises you: "Show me the sub-scores for week 5." Disagree with any number you like. The plan re-scores.
4. If the first line says your outcome is unrealistic for your hours, take the adjusted outcome it offers and run the prompt again.
5. Confirm that week 1 ships something small and finished. A short, live artifact beats a big plan.

## Step 3: Put the Plan in Notion

### Option A: Let Claude Build It (Recommended)

1. Connect Notion to Claude. In Claude, open Customize, then Connectors, find Notion and connect it, then approve access in the browser window that opens. If Notion is missing from the list, add a [custom connector](https://mcp.notion.com/mcp). Menu names shift between versions, so check Notion's [MCP setup guide](https://developers.notion.com/guides/mcp/get-started-with-mcp) if these steps move. The connector can read and update whatever your Notion account can reach, so the prompt below tells Claude to write inside one page only.
2. In [Notion](https://www.notion.com), create an empty page called "The Curriculum Architect".
3. Go back to the same Claude chat from Step 1, so it already has your plan, and paste this:

\`\`\`
Using my Notion connector, build my Curriculum Architect workspace inside the page called "The Curriculum Architect". Write only inside that page. Create each of the three databases below as an actual Notion database with properties and views.

1. At the top of the page, a Settings section with: my outcome word for word, my stated weekly hours, my plannable hours (stated hours x 0.7), my plan start date, and my quarter end date (start date + 12 weeks).

2. A Scoring rules section with the ROI formula, the sub-score bands and the three score bands, copied exactly from the prompt I gave you.

3. A Sources section listing every source URL from the signal list, grouped by category.

4. A database called "Curriculum" with these properties: Week (title), Start date (date), Skill (text), Layer (select: Core, Edge, Consolidation, Sell), Why it pays (text), Proof link (URL), Artifact (text), Hours (number), ROI score (number), Status (select: Not started, In progress, Shipped, Cut). Fill it with the 12 weeks from my plan. Set Status to Not started and space the start dates one week apart.

5. A database called "Signal log" with these properties: Signal (title), Pulled (date), Source (select: Job board, Freelance, Founder, Tool, Saturation), Skill (text), Mentions (number), Rate (text), Link (URL). Fill it with every signal you found, each with its link and today's date.

6. A database called "Proof stack" with these properties: Artifact (title), Shipped (date), Skill demonstrated (text), Live URL (URL), One-line pitch (text), Used in (multi-select: Portfolio, Cold outreach, Case study, Sales page). Leave it empty. I fill it as I ship.

7. A "Rejected skills" section listing every rejected skill with its score and reason.

8. A "Change log" section at the bottom, empty for now.

9. On the Curriculum database, a calendar view by Start date and a board view grouped by Status.

When you finish, give me a link to the page and to each database.
\`\`\`

### Option B: Build It by Hand

1. In the Step 1 chat, ask: "Give me Table 1 as a CSV with a header row."
2. Save the result as a .csv file.
3. In Notion, go to Settings, then Import, then CSV (or type /csv on a page). Upload the file and choose to create a new database. Notion turns each column into a property. Guide: https://www.notion.com/help/import-data-into-notion
4. Create two more databases, Signal log and Proof stack, with the properties listed in the prompt above.

Your plan is live. When you ship your week 1 artifact, share it with other members inside Disgustingly Paid: https://www.skool.com/disgustingly-paid/about

## Step 4: Set Up the Sunday Refresh

The refresh re-pulls the signals, re-scores your Edge weeks, applies the gates and writes you a note. A scheduled run starts fresh with no memory of your chat, so this prompt tells it to read everything it needs from your Notion page.

Test the prompt once in a normal chat before you schedule it.

\`\`\`
You are my Curriculum Architect running my Sunday refresh. Use my Notion connector and work only inside the page called "The Curriculum Architect".

1. Read the Settings section for my outcome, plannable hours and plan dates. Read the Scoring rules section. Read the Curriculum database for my current plan and statuses. Read the Signal log for last week's signals.

2. Search the live web for every source listed in the Sources section. Add each new signal to the Signal log with today's date, mentions, rate and a direct link. A signal without a link stays out. Note any source you could not reach in the Change log entry.

3. Re-score every Edge week that has not started, and every new candidate skill, using the Scoring rules. Show the sub-scores.

4. Apply these gates.

   ADD a skill only if all four are true:
   a. It appears in at least 3 independent sources this week
   b. It also appeared in last week's run
   c. Its ROI is 70 or higher
   d. Its prerequisites are already scheduled or done

   CUT a skill only if all four are true:
   a. Its ROI is below 45
   b. It has been below 45 for 2 runs in a row
   c. Its week has not started
   d. Nothing later in the plan depends on it

   Hard limits:
   - One Edge swap per week, maximum
   - Core weeks stay as they are until the quarter end date in Settings
   - Weeks marked In progress or Shipped never change

   When you cut a week, set its Status to Cut and add the replacement as a new row with the same week number and start date.

5. Add a dated entry to the Change log section, in plain language: what changed, what stayed the same, and why. If nothing crossed a gate, write "No changes this week" and give the reason in one or two sentences.

6. Finish with a three-line summary for me: what changed, what holds, and what to focus on this week.
\`\`\`

Pick one way to run it every Sunday.

### Option A: A Claude Scheduled Task (Paid Claude Plan)

1. In Claude, click Scheduled in the left sidebar, then New task, then Create with Claude. In the newer Claude experience, open any conversation and describe the task and how often it should run.
2. Paste the refresh prompt and ask for it to run weekly on Sundays at a time you will actually look at the result.
3. Answer any questions Claude asks, review the name, schedule and instructions it proposes, then click Schedule.
4. Check that your Notion connector is on and that its tool permissions allow writing. Review each run from the Scheduled page.

Scheduled tasks run remotely, so your computer can be off. Claude's guide: [Schedule recurring tasks in Claude](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork)

### Option B: A Notion Custom Agent (Notion Business or Enterprise Plan)

1. In Notion, open Agents in the sidebar, click +, and choose Create blank.
2. Paste the refresh prompt as the instructions. Change "Use my Notion connector" to "Use the pages and databases this agent has access to".
3. In Settings, open Triggers, add a Recurring trigger, and choose weekly on Sunday with your time and timezone.
4. Under Tools and access, add The Curriculum Architect page and its databases. Turn on Web access, since the refresh needs live search.

Notion's guide: [Custom agents](https://www.notion.com/help/custom-agents)

### Option C: The Free Manual Refresh (10 Minutes)

1. Add a repeating Sunday reminder to your calendar.
2. Open a new chat with web search on and Notion connected.
3. Paste the refresh prompt and read the Change log entry it writes.

Many weeks will say "No changes this week." That is the system working as designed. A plan that changes every week to look busy is a plan nobody can finish.

## Step 5: Your Weekly Rhythm

- Sunday (5 minutes): read the Change log entry and look at this week's skill in the Curriculum database.
- Monday to Saturday: work the one skill for the week, at your plannable hours.
- End of the week: ship the artifact with a URL. Set the week's Status to Shipped. Add the artifact to the Proof stack with a one-line pitch.
- Weeks 4 and 8: consolidation. No new skill. Combine the last three weeks into one larger artifact.
- Weeks 10 to 12: selling. Use your Proof stack for your portfolio, your outreach and your pricing conversations.
- After week 12: run the Day 1 prompt again for the next quarter. This is when Core gets re-evaluated.

When the refresh recommends a swap, it only touches an Edge week that has not started. Finish what you have started.

## Troubleshooting

**The AI is listing postings you cannot find.**
Web search is off, or the AI skipped it. Turn it on and reply: "Search the web. Every signal needs a direct link. Redo it."

**Several sources came back as unreachable.**
Some sites block AI search tools, and LinkedIn, Indeed and Upwork do this often. The system logs them as unreachable and works with the rest. Add sources from your own niche to the Sources section in Notion and the refresh will use them.

**The plan is too big for my hours.**
The 0.7 discount is already applied. Give a lower weekly number, or accept the 18-week version.

**Notion built things in the wrong place.**
Check that the page is named exactly "The Curriculum Architect", that the Notion connector is switched on for the chat, and that you pasted the prompt in the same chat as your plan. Ask Claude to move or rebuild anything that landed elsewhere.

**The scheduled run did not update Notion.**
Open the latest run from the Scheduled page and read what happened. Common causes are a Notion connector that is off, a tool permission that blocks writing, or a run waiting for your approval.

**The refresh keeps changing my plan.**
Reply with the hard limits: one Edge swap per week, Core untouched until the quarter end date, and nothing changes for weeks In progress or Shipped.

## Make It Yours

- **Changing your outcome.** Run the Day 1 prompt again with the new outcome and rebuild the Curriculum database. Keep the old plan in your Notion history.
- **Changing your hours.** Update the Settings section in Notion. The next refresh uses the new number.
- **Adding sources.** Add the URL to the Sources section in Notion. The next refresh checks it.
- **Going deeper.** If you have more hours, add depth to the Core weeks and keep the number of skills the same.

Stuck on a step? Bring your question to Disgustingly Paid: https://www.skool.com/disgustingly-paid/about

That is the full build. Part 2 of 4 is next, so follow @theblackfemaleengineer to catch it. To build this with me and other members, join Disgustingly Paid: https://www.skool.com/disgustingly-paid/about

Naya

---------------------------------------------------------------------
Hi, I'm Naya! I'm using AI to become DISGUSTINGLY skilled, wealthy and educated.
Join Disgustingly Paid: https://www.skool.com/disgustingly-paid/about
Follow for daily tips and insights.

${SKOOL_CTA}`;

async function main() {
  const post = await prisma.blogPost.update({
    where: { slug: 'curriculum-architect-day-1-guide' },
    data: { content },
  });
  console.log('Updated:', post.slug);
}

main().finally(() => prisma.$disconnect());

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: string;
  category: string;
  tags: string[];
  featured?: boolean;
  image?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-i-pivoted-from-finance-to-software-engineering",
    title: "How I Pivoted from Finance to Software Engineering",
    excerpt: "My journey from crunching numbers in spreadsheets to writing code that impacts millions. Here's exactly how I made the switch and what I learned along the way.",
    content: `
When I graduated with my Finance degree in 2020, I never imagined I'd be writing code for a living. But here I am, and I want to share exactly how I made this transition because I know so many of you are considering the same leap.

## The Moment Everything Changed

I was sitting in my cubicle, staring at yet another Excel model, when I realized something: I was automating parts of my job with VBA macros, and that was the most exciting part of my day. That's when I knew I needed to explore this further.

## My Learning Path

I didn't quit my job immediately. Instead, I started learning to code on the side. Here's what worked for me:

- Started with freeCodeCamp for HTML, CSS, and JavaScript basics
- Spent 2 hours every morning before work coding
- Built small projects that solved real problems I had
- Joined online communities like Twitter tech and Discord servers

## The Hardest Part

Imposter syndrome hit hard. I constantly questioned whether I was "technical enough" to call myself a developer. But here's what I learned: everyone feels this way, even senior engineers with decades of experience.

## Making the Leap

After about 8 months of consistent learning and building projects, I started applying for junior developer roles. I was rejected a lot. Like, a LOT. But I kept refining my approach, practicing algorithms, and improving my portfolio.

## What I'd Tell My Past Self

- Start before you feel ready
- Document your journey publicly (it opens doors)
- Your non-tech background is actually an advantage
- The tech community is more welcoming than you think

If you're considering making a similar pivot, know that it's absolutely possible. It won't be easy, but nothing worth doing ever is.
    `,
    author: "Nyaradzo",
    publishedAt: "2026-01-15",
    readTime: "6 min read",
    category: "Career",
    tags: ["career-change", "software-engineering", "finance", "learning"],
    featured: true,
  },
  {
    slug: "ai-tools-every-developer-should-know-in-2026",
    title: "AI Tools Every Developer Should Know in 2026",
    excerpt: "From Claude to Cursor, AI is transforming how we write code. Here are the tools that have genuinely made me more productive (and the ones that are just hype).",
    content: `
AI coding tools have exploded over the past few years, and honestly, it's hard to keep up. I've tested dozens of them so you don't have to. Here's my honest breakdown of what's actually worth your time in 2026.

## The Game Changers

### Claude Code

This has become my daily driver. What sets it apart is that it actually understands context across your entire codebase. I use it for everything from debugging to writing tests to explaining legacy code I've inherited.

### Cursor

If you haven't switched from VS Code to Cursor yet, you're missing out. The AI-first approach means features like inline editing and chat feel native rather than bolted on.

### GitHub Copilot

Still solid for autocomplete and quick suggestions. It's best for boilerplate code and common patterns. I use it alongside Claude Code rather than as a replacement.

## The Overhyped

I won't name names, but be skeptical of tools that promise to "build your entire app from a prompt." We're not there yet. AI is a productivity multiplier, not a replacement for understanding what you're building.

## How I Actually Use AI in My Workflow

- Code reviews: I ask AI to review my PRs before submitting
- Learning: When I encounter unfamiliar code, I ask for explanations
- Testing: Generating test cases for edge cases I might miss
- Documentation: First drafts of READMEs and code comments

## The Skills That Still Matter

Don't let AI make you lazy about fundamentals. You still need to understand:

- Data structures and algorithms
- System design principles
- How to read and debug code
- When AI is confidently wrong (it happens!)

## My Advice

Embrace these tools, but treat them as partners, not replacements. The developers who thrive will be those who learn to collaborate effectively with AI while maintaining strong foundational skills.
    `,
    author: "Nyaradzo",
    publishedAt: "2026-01-10",
    readTime: "5 min read",
    category: "Tech",
    tags: ["ai", "developer-tools", "productivity", "claude"],
    featured: true,
  },
  {
    slug: "the-self-taught-developer-roadmap-for-2026",
    title: "The Self-Taught Developer Roadmap for 2026",
    excerpt: "No bootcamp? No CS degree? No problem. Here's the exact path I'd follow if I were starting from scratch today.",
    content: `
I get DMs every week asking how to break into tech without a traditional background. After years of helping people make this transition, I've refined my recommendations into this roadmap.

## Month 1-2: Foundations

Start with the basics. Don't skip this even if it feels slow.

- HTML & CSS: Build 5 simple static websites
- JavaScript fundamentals: Variables, functions, loops, DOM manipulation
- Git basics: Learn to commit, push, and create branches
- Command line: Get comfortable with basic terminal commands

## Month 3-4: Level Up Your JavaScript

Now go deeper:

- ES6+ features (arrow functions, destructuring, async/await)
- Build 3 interactive projects (todo app, weather app, quiz game)
- Learn about APIs and how to fetch data
- Introduction to React or another frontend framework

## Month 5-6: Backend Basics

Full-stack knowledge makes you more valuable:

- Node.js and Express
- Databases (start with PostgreSQL or MongoDB)
- Build a full-stack project with user authentication
- Learn about RESTful API design

## Month 7-8: Job-Ready Skills

Time to polish and prepare:

- Build 2-3 portfolio projects you're proud of
- Practice data structures and algorithms (LeetCode, but don't overdo it)
- Write a technical blog post about something you learned
- Optimize your LinkedIn and GitHub profiles

## Month 9+: Apply and Iterate

- Start applying to jobs (yes, even if you don't feel ready)
- Do mock interviews with friends or online communities
- Keep building and learning based on job requirements you see
- Consider open source contributions

## Resources I Recommend

- freeCodeCamp (free, comprehensive)
- The Odin Project (project-based learning)
- Frontend Masters (paid but excellent)
- CS50 on YouTube (Harvard's intro to CS)

## The Secret No One Tells You

Consistency beats intensity. One hour every day is better than 10 hours on Saturday. Set a sustainable pace and protect your learning time like it's a meeting you can't miss.

You've got this.
    `,
    author: "Nyaradzo",
    publishedAt: "2026-01-05",
    readTime: "7 min read",
    category: "Coding",
    tags: ["self-taught", "roadmap", "learning", "beginner"],
    featured: false,
  },
  {
    slug: "negotiating-your-tech-salary-what-actually-works",
    title: "Negotiating Your Tech Salary: What Actually Works",
    excerpt: "I increased my offer by $25K with a single email. Here's the exact framework I used and how you can do the same.",
    content: `
Let me tell you about the most profitable email I ever sent. It took me 15 minutes to write and resulted in a $25,000 increase to my offer. Negotiation is a skill, and like any skill, it can be learned.

## Why Most People Don't Negotiate

Fear. That's it. We're afraid they'll rescind the offer, think less of us, or that we're being greedy. Here's the truth: companies expect you to negotiate. They build room into their offers for exactly this reason.

## The Framework That Works

### Step 1: Get the Offer in Writing

Never negotiate verbally. Always ask for the offer in writing first. This gives you time to think and creates a paper trail.

### Step 2: Express Enthusiasm

Start your response by expressing genuine excitement about the role. You want them to know you're interested before you start negotiating.

### Step 3: Do Your Research

Use Levels.fyi, Glassdoor, and Blind to understand the market rate for your role. Know your number before you start talking.

### Step 4: Make Your Ask

Be specific and justify your request. Here's a template:

"Thank you so much for this offer. I'm really excited about the opportunity to join [Company]. Based on my research and conversations with others in similar roles, I was expecting something closer to [X]. Given my experience with [specific skill] and [relevant achievement], would you be able to move closer to that number?"

### Step 5: Negotiate Beyond Salary

If they can't move on base salary, try:

- Signing bonus
- Extra equity/RSUs
- Remote work flexibility
- Professional development budget
- Extra PTO
- Earlier performance review

## What Not to Do

- Don't apologize for negotiating
- Don't give a range (they'll pick the bottom)
- Don't lie about competing offers
- Don't make it personal or emotional

## The Worst They Can Say Is No

In my experience, I've never seen an offer rescinded because someone tried to negotiate professionally. The worst outcome is they say no and you still have the original offer.

Remember: negotiation isn't about being aggressive or greedy. It's about advocating for your worth. You deserve to be paid fairly for the value you bring.
    `,
    author: "Nyaradzo",
    publishedAt: "2025-12-28",
    readTime: "5 min read",
    category: "Career",
    tags: ["salary", "negotiation", "job-offer", "money"],
    featured: false,
  },
  {
    slug: "how-to-learn-any-new-technology-fast",
    title: "How to Learn Any New Technology Fast",
    excerpt: "The tech industry moves fast. Here's my system for picking up new frameworks, languages, and tools without getting overwhelmed.",
    content: `
Last month I needed to learn a new framework for a project. Within two weeks, I was productive enough to ship features. This wasn't magic—it was a system I've refined over years of constantly learning new tech.

## The Problem with Most Learning

Most people try to learn everything before building anything. They watch tutorial after tutorial, take notes, and feel productive. But when it's time to actually build, they're stuck.

This is tutorial hell, and it's the biggest trap in tech education.

## My Learning System

### Phase 1: Quick Overview (2-4 hours)

- Read the official "Getting Started" docs
- Watch ONE overview video (not a full course)
- Understand the core concepts and terminology
- Set up a basic "Hello World" project

### Phase 2: Build Something Small (1-2 days)

- Pick a tiny project (not your actual goal)
- Build it using only official docs and Stack Overflow
- Struggle is part of the process—don't give up too quickly
- Take notes on concepts that confuse you

### Phase 3: Build Your Actual Project (ongoing)

- Start building what you actually need to build
- Learn concepts just-in-time as you need them
- Reference your notes from Phase 2
- Ask for help when stuck for more than 30 minutes

## Why This Works

Learning is not linear. You don't need to understand everything before you can be productive. You need to understand enough to start, then fill in gaps as you go.

Building forces you to confront what you don't understand. Tutorials let you passively absorb information without testing whether you can apply it.

## Tips for Faster Learning

- Read error messages carefully (they usually tell you the solution)
- Use AI tools to explain concepts you don't understand
- Join Discord communities for the technology you're learning
- Teach what you learn (tweet about it, write about it)

## When to Go Deeper

Once you're productive with the basics, then consider:

- Taking a comprehensive course
- Reading the full documentation
- Understanding the internals
- Contributing to open source

But only after you've built something real first.

## The Mindset Shift

Stop thinking "I need to learn X" and start thinking "I need to build Y using X." The technology is a tool, not the goal. Focus on what you're trying to create, and the learning will follow.
    `,
    author: "Nyaradzo",
    publishedAt: "2025-12-20",
    readTime: "4 min read",
    category: "Life",
    tags: ["learning", "productivity", "self-improvement", "tips"],
    featured: false,
  },
];

export const blogCategories = [
  "All",
  "Tech",
  "Career",
  "Coding",
  "Finance",
  "Life",
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter((post) => post.featured);
}

export function getPostsByCategory(category: string): BlogPost[] {
  if (category === "All") return blogPosts;
  return blogPosts.filter((post) => post.category === category);
}

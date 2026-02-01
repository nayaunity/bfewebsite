---
name: create-blog-post
description: Create a new blog post and add it to the production database. Use when the user wants to add a blog post to the /blog page.
argument-hint: [topic or full content]
disable-model-invocation: true
allowed-tools: Bash, WebFetch, Read, Write, Edit, Glob, Grep
---

# Create Blog Post

Create a blog post based on: $ARGUMENTS

## CRITICAL: Preventing Truncation

**NEVER** write blog content directly in the database command. Always:

1. First, write the COMPLETE content to a temporary file
2. Read it back to verify it's complete
3. Then use the file content in the database command

This prevents any truncation from command length limits or escaping issues.

## Step 1: Gather Content

If the user provides a topic (not full content):
- Ask clarifying questions about the post's angle, key points, and target audience
- Draft the content and get user approval before proceeding

If the user provides full content:
- Review it for completeness
- Identify any code snippets, prompts, or templates that need code block formatting

## Step 2: Format the Content

### Required Formatting Rules

1. **Code blocks for copyable content** - Wrap these in triple backticks:
   - AI prompts or templates
   - Code snippets
   - Instructions meant to be pasted elsewhere
   - Fill-in-the-blank templates with [BRACKETS]

2. **Markdown structure**:
   - `## Heading` for main sections
   - `### Subheading` for subsections
   - `**Bold**` for emphasis on key terms
   - `- Bullet lists` for unordered items
   - `1. Numbered lists` for sequential steps
   - Plain URLs (they auto-link)

3. **Content structure**:
   - Opening: Personal hook or attention-grabbing statement (1-2 paragraphs)
   - Body: Organized sections with clear headings
   - Closing: Encouraging call-to-action or motivational sign-off

## Step 3: Write Content to Temporary File

**ALWAYS** save the complete formatted content to a temp file first:

```bash
cat > /tmp/blog-post-content.txt << 'BLOGEOF'
[COMPLETE BLOG CONTENT HERE]
BLOGEOF
```

Then verify the content is complete:

```bash
wc -c /tmp/blog-post-content.txt
cat /tmp/blog-post-content.txt
```

**If the content appears truncated, STOP and rewrite the file.**

## Step 4: Add to Production Database

**IMPORTANT:** This project uses a production Turso database. Always add posts directly to production.

Read the content from the temp file and insert into the database:

```bash
CONTENT=$(cat /tmp/blog-post-content.txt)

DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number'
});

const prisma = new PrismaClient({ adapter });

const content = \`$CONTENT\`;

async function main() {
  const post = await prisma.blogPost.create({
    data: {
      slug: 'your-post-slug',
      title: 'Your Post Title',
      excerpt: 'A 1-2 sentence description for previews',
      content: content,
      author: 'Nyaradzo',
      category: 'Tech',
      tags: JSON.stringify(['tag1', 'tag2']),
      featured: false,
    },
  });
  console.log('Created:', post.slug);
  console.log('Content length:', post.content.length);
}

main().finally(() => prisma.\$disconnect());
"
```

### Field Requirements

| Field | Format | Example |
|-------|--------|---------|
| slug | lowercase, hyphenated | `how-to-learn-python` |
| title | Title case, engaging | `How to Learn Python in 2026` |
| excerpt | 1-2 sentences | `A practical guide to learning Python...` |
| author | Always | `Nyaradzo` |
| category | One of: | `Career`, `Tech`, `Life`, `Finance`, `Coding` |
| tags | JSON array, lowercase | `["python", "coding", "beginners"]` |
| featured | boolean | `true` for flagship posts |

## Step 5: Verify the Post

After creating, fetch the post back to confirm it wasn't truncated:

```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number'
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const post = await prisma.blogPost.findUnique({
    where: { slug: 'your-post-slug' }
  });
  console.log('Title:', post.title);
  console.log('Content length:', post.content?.length);
  console.log('First 200 chars:', post.content?.substring(0, 200));
  console.log('Last 200 chars:', post.content?.substring(post.content.length - 200));
}

main().finally(() => prisma.\$disconnect());
"
```

**Check that:**
- Content length matches expected length
- Last 200 chars show the actual ending (not cut off mid-sentence)

If truncated, delete and recreate:

```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number'
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.blogPost.delete({
    where: { slug: 'your-post-slug' }
  });
  console.log('Deleted post');
}

main().finally(() => prisma.\$disconnect());
"
```

## Step 6: Deploy (Optional)

If changes need to be deployed:

```bash
vercel --prod
```

## Step 7: Report Results

Tell the user:
- Post title and slug
- URL: `/blog/[slug]`
- Content length (characters)
- Confirmation that content is complete (not truncated)

## Example: Code Block Formatting

When content includes prompts or templates, format like this:

**Bad (no code block):**
```
Copy this prompt: You are an AI assistant that helps with...
```

**Good (with code block):**

Here's the prompt to use:

\`\`\`
You are an AI assistant that helps with [TASK].

When the user asks for help, you should:
1. [FIRST STEP]
2. [SECOND STEP]
3. [THIRD STEP]
\`\`\`

## Common Tags Reference

- **Career**: `career`, `job-search`, `resume`, `linkedin`, `apprenticeship`, `interview`
- **Tech**: `ai`, `machine-learning`, `tools`, `communities`, `resources`
- **Coding**: `python`, `javascript`, `coding`, `beginners`, `projects`, `learning`
- **Life**: `productivity`, `goals`, `personal-development`, `habits`
- **Finance**: `salary`, `negotiation`, `budgeting`, `investing`

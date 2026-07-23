import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: 'number'
});

const prisma = new PrismaClient({ adapter });

const content = `You do not need to pay for AI to start using it seriously. The best tools in the world all have free tiers, and most people never hit the caps.

This is the exact free AI stack I recommend, organized by what you are trying to do. I included the real free-tier limits so you know exactly what you get before spending a dollar.

## The Core Chat Tools

If you want a $0 AI stack, start here. If you are learning, brainstorming, or writing, these are the tools you open first.

- **[ChatGPT](https://chatgpt.com)** (48 prompts/day) - The most well-known. Strong for general writing, brainstorming, and quick answers. ChatGPT and Claude are both stronger for repeated daily use.
- **[Claude](https://claude.ai)** (30-100 prompts/day) - My personal favorite for longer, more nuanced writing and thinking. Better at following complex instructions and maintaining context.
- **[Gemini](https://gemini.google.com)** (30 prompts/day) - Google's model. Gives a decent free chat allowance plus longer context, which helps when you are working with big documents.

## The Research Tools

If your goal is better answers, research, and planning.

- **[Perplexity](https://perplexity.ai)** (200 prompts/day) - Use Perplexity when you want live, source-backed answers and faster research workflows. It cites its sources, so you can actually verify what it tells you.
- **[Gemini API](https://ai.google.dev)** (1,000 requests/day) - Use the Gemini API when you need cheap or free structured output at scale for experiments, automations, or lightweight product builds.

## The Build Tools

If you want to turn ideas into assets. This is the part of your stack that helps you turn ideas into something usable.

- **[Canva](https://canva.com)** (Free Tier) - For designing assets. Thumbnails, carousels, presentations, social posts. The free tier covers most of what you need.
- **[Notion](https://notion.so)** (Unlimited pages + blocks) - For organizing projects and systems. The free plan gives you unlimited pages and blocks, which is more than enough to build a real workspace.
- **[Gamma](https://gamma.app)** (400 AI credits) - For quickly turning outlines or rough notes into polished decks and docs. Great when you need something presentation-ready fast.

## The Content Tools

If you want to create voice, video, and edited content on $0. These tools are best for testing content formats, not building a full production machine for free. You can absolutely prototype with them, but the caps mean you need to be intentional about what you create.

- **[ElevenLabs](https://elevenlabs.io)** (10 audio minutes/month) - AI voice generation. Enough to test voiceovers, narration, or audio content ideas before committing to a paid plan.
- **[HeyGen](https://heygen.com)** (3 videos/month) - AI avatar videos. Good for testing whether video content works for your audience without filming yourself.
- **[CapCut](https://capcut.com)** (Free Tier) - Video editing with AI features like auto-captions and background removal. A solid free alternative to paying for editing software.

## The Student Path

If you have a school email, educator verification, or referral access, you can stretch your free stack a lot further before paying.

- **Perplexity** - 1 year free Pro with a .edu email
- **Canva** - 100% free Pro for students and educators
- **Notion** - Free Edu+ Plan with expanded features

Student tier means more runway. If you qualify, use it.

## 10 More Free AI Tools to Add to Your Stack

Here is where it gets good. These are 10 more free-tier AI tools you can plug in, grouped by what they actually help you do.

### Research

**1. [NotebookLM](https://notebooklm.google.com) (Google)** - Personal research workspace. Upload docs, links, and notes, then ask questions against your own "notebook" instead of the entire web. Strong for summarizing PDFs, pulling key insights, and building briefs or study guides from multiple sources.

**2. [Semantic Scholar](https://www.semanticscholar.org)** - Academic search with AI. Free AI-powered search engine for papers that surfaces the most relevant and influential research in a field. Great for anyone doing serious research (theses, whitepapers, deep dives) without a university library setup.

**3. [Research Rabbit](https://www.researchrabbit.ai)** - "Spotify for papers." Feed in papers and it maps networks of related work and authors, helping you discover what you would miss with normal keyword search. Ideal for deep learning in public and wanting receipts.

### Learning

**4. [Khanmigo](https://www.khanacademy.org/khan-labs) (Khan Academy AI)** - Guided practice. AI tutor integrated into Khan Academy's free curriculum, especially strong for math, science, and foundational subjects. Good for skill stacking alongside your tech and AI work, especially if you want to strengthen fundamentals.

**5. [AskCodi](https://www.askcodi.com)** - Coding and logic help. Offers a free tier that helps explain code, debug, and walk you through logic step by step. Great if you want the self-taught engineer path but with AI as a co-pilot.

### Creating

**6. [Krea](https://www.krea.ai)** - Image and design playground. Free tier for generating and iterating on images. Popular for aesthetic moodboards, thumbnails, and visual concepts. Pairs nicely with Canva: generate visuals in Krea, lay them out and brand them in Canva.

**7. [Pika](https://pika.art)** - Text-to-video bursts. Free tier that lets you generate short clips from text or images, strong for b-roll, intros, and visual hooks. Perfect for "Build With Me" style content where you want dynamic visuals without filming everything.

**8. [Suno](https://suno.com)** - Music generation. Free tier for creating short music tracks for intros, reels, or background audio. Gives your content a polished vibe without paying for stock music.

### Earning More

**9. [Descript](https://www.descript.com) (free tier)** - Edit like a document. Free plan includes limited transcription and overdub. You edit audio and video by editing the transcript. Powerful for repurposing talking-to-camera content into clips, podcasts, or course material without a full editor.

**10. [Zapier](https://zapier.com) (free tier)** - Glue for income systems. No-code automations connecting your AI tools to forms, email, and payment platforms, with a limited number of free tasks. Great for turning your AI-generated assets into real systems: lead capture to email nurture to product delivery.

## The Bottom Line

You have access to the same AI tools as everyone else. The difference is whether you actually use them.

Pick one category that matches what you need right now, set up the tools, and start building. You do not need to master all 19 at once. Start with the core chat tools, add one or two from the category that fits your current goal, and expand from there.

The stack is free. The only cost is starting.`;

async function main() {
  const post = await prisma.blogPost.create({
    data: {
      slug: 'free-ai-tool-stack',
      title: 'How to Strategically Use the Best AI Tools for $0',
      excerpt: 'The exact free AI stack I recommend, with real free-tier caps, organized by what you are trying to do. Plus 10 bonus tools for research, learning, creating, and earning more.',
      content,
      author: 'Nyaradzo',
      category: 'Tech',
      tags: JSON.stringify(['AI', 'tools', 'free', 'productivity', 'resources', 'content creation']),
      featured: false,
    },
  });
  console.log('Created:', post.slug);
  console.log('Content length:', post.content.length);
}

main().finally(() => prisma.$disconnect());

import type { Metadata } from "next";
import React from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import HowIMakeContentPageViewTracker from "./PageViewTracker";

export const metadata: Metadata = {
  title: "How I Actually Make Content: 13 Questions, Answered | The Black Female Engineer",
  description:
    "A member asked how I choose what to be known for, pick ideas, write hooks, film on a phone, and use AI without losing my voice. Honest answers to all 13 questions.",
  robots: {
    index: false,
    follow: false,
  },
};

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-2xl md:text-3xl mt-12 mb-4 text-[var(--foreground)]">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[var(--foreground)] mb-4 leading-relaxed">{children}</p>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold">{children}</strong>;
}

function VideoComing({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface-warm)] border border-[var(--border-warm)] rounded-2xl p-5 mb-4">
      <p className="text-[var(--foreground)] leading-relaxed">
        <Strong>Video coming.</Strong>{" "}
        {children ?? "This is one where I need to show you, not describe it."}
      </p>
    </div>
  );
}

export default function HowIMakeContentPage() {
  return (
    <>
      <PagePresenceTracker page="skool-how-i-make-content" />
      <HowIMakeContentPageViewTracker />
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--cta-bg)] text-white font-medium">
              AI Income Lab
            </span>
            <span className="text-sm text-[var(--gray-600)]">
              Members only. Please don&apos;t share this link.
            </span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-4 text-[var(--foreground)]">
            How I <span className="italic text-[var(--accent)]">Actually</span> Make Content
          </h1>
          <p className="text-lg text-[var(--gray-600)] mb-8 pb-8 border-b border-[var(--card-border)]">
            13 questions from one of you, answered honestly. Video tutorials coming for the
            ones that need showing instead of telling.
          </p>

          {/* Intro */}
          <P>
            One of you sent me a list of questions about how I actually make content. Not the
            philosophy, the mechanics. How I pick ideas, how I film, how I edit, how I use AI
            without sounding like AI.
          </P>
          <P>
            It was a good list. Good enough that I&apos;m going to turn a lot of it into
            proper video tutorials. But some of these questions don&apos;t need a video, they
            need a straight answer, so here&apos;s the whole list with my honest responses.
            Where I&apos;ve flagged &quot;video coming,&quot; I mean it. Those are the ones
            where showing beats telling.
          </P>

          <H2>1. How to choose what to be known for</H2>
          <P>Ask yourself two questions:</P>
          <ol className="list-decimal ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">What do you want to be known for?</li>
            <li className="text-[var(--foreground)] mb-2">
              What can you talk about without fail for three or more years?
            </li>
          </ol>
          <P>
            The second question is the filter. Plenty of things sound good to be known for.
            Very few of them are things you&apos;d still want to be talking about in year
            three, when the novelty is gone and you&apos;re on video number 400. Pick the
            overlap.
          </P>

          <H2>2. How to define the audience and content pillars</H2>
          <P>
            Content pillars matter less than people think. You don&apos;t need a color-coded
            framework to start posting.
          </P>
          <P>
            The audience is the part worth getting right, and there&apos;s a shortcut:{" "}
            <Strong>let your audience be you from six months ago.</Strong> Or a year ago, or
            whatever timeframe you choose. You know exactly what that person was confused
            about, what they were Googling at midnight, and what would have saved them time.
            Make content for her.
          </P>

          <H2>3. How to research and select strong ideas</H2>
          <P>
            Build a content strategist. I did this about three months ago and it&apos;s how I
            make every piece of content now. It&apos;s an AI assistant that knows my niche, my
            voice, my past content, and what&apos;s performed, and I go to it before I make
            anything.
          </P>
          <P>
            The full tutorial for building your own is in the{" "}
            <Strong>Phase 2 classroom</Strong>.
          </P>

          <H2>4. How to write hooks and scripts</H2>
          <P>Same tool. My process:</P>
          <ol className="list-decimal ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              I write what I want to say, in my own words, as a rough script.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              I feed that to my content strategist.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              It takes what I wrote and gives me back stronger hooks and a tighter script
              built from my draft.
            </li>
          </ol>
          <P>
            The order matters. I write first, AI optimizes second.{" "}
            <Strong>You always remain the brain. AI is the optimizer.</Strong> If you flip
            that, you get generic content with your face on it.
          </P>

          <H2>5. How to plan storyboards, shots, angles, and B-roll</H2>
          <P>I don&apos;t plan B-roll at all.</P>
          <P>
            I pick filming days and film as much footage of myself as I can. Later, when
            I&apos;m editing, I pull from that library and pick whatever clip fits a specific
            part of the script. That&apos;s it.
          </P>
          <P>
            If I tried to plan every shot, I&apos;d get so overwhelmed by the idea of making
            content that I wouldn&apos;t make any. That&apos;s also why, for about four years,
            most of my content was what I called &quot;talking head&quot; content: me in
            front of my desk, just talking. When you&apos;re starting out, the whole process
            needs to be as easy as possible. Complexity is how people quit.
          </P>

          <H2>6. How to film confidently with a phone</H2>
          <P>Filming confidently and filming well are two different skills.</P>
          <P>
            <Strong>Filming confidently</Strong> only comes with practice. It will take time
            to stop feeling awkward on camera, so just do it awkward. Slowly it gets easier,
            and slowly you get better. There&apos;s no shortcut and nobody skips this part.
          </P>
          <P>
            <Strong>Filming well</Strong> is partly just phone settings:
          </P>
          <ul className="list-disc ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">Turn off HDR.</li>
            <li className="text-[var(--foreground)] mb-2">
              Wipe your camera lens before every single take.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Pull the exposure down when filming. I like -0.7.
            </li>
          </ul>

          <H2>7. How to record natural talking-head videos and voice-overs</H2>
          <P>
            Pretend you&apos;re on FaceTime with a friend. You&apos;re telling them about the
            thing you just scripted. Press record, begin.
          </P>
          <P>
            That&apos;s the whole technique. The camera is a friend who happens to be very
            quiet.
          </P>

          <H2>8. How to edit for pacing and retention</H2>
          <VideoComing>
            This is one where I need to show you the timeline, not describe it.
          </VideoComing>

          <H2>9. How to layer footage, text, graphics, captions, music, and sound</H2>
          <VideoComing>Same reason. You need to see it on screen.</VideoComing>

          <H2>10. How to use AI without losing your voice</H2>
          <P>
            This is why scripting on your own first matters so much. When you write the first
            draft, your strategist is editing from a baseline that came from your voice, so
            the output still sounds like you. When you skip that step, it&apos;s editing from
            nothing, and nothing sounds like everyone.
          </P>
          <P>
            You can also train the AI tools you use on your voice and save that as a reusable
            skill or instruction set, so every session starts already knowing how you talk.
            I&apos;ve made a note to do a full tutorial on exactly this.
          </P>

          <H2>11. How to batch, organize, publish, and repurpose content</H2>
          <VideoComing />

          <H2>12. How to use analytics to improve</H2>
          <VideoComing />

          <H2>13. How to connect free content to an email list or paid offer</H2>
          <P>I use Manychat. It&apos;s an automation you set up on your Instagram account.</P>
          <P>
            You know when creators say &quot;comment X and I&apos;ll send you the link&quot;?
            That&apos;s Manychat. It watches for the keyword, DMs the person automatically,
            and collects their email along the way. Free content on the front, email list on
            the back, paid offer whenever you&apos;re ready. Full walkthrough of my setup is
            coming as a video too.
          </P>

          <H2>The pattern in all of this</H2>
          <P>
            If you read back through the answers, the same idea shows up over and over:{" "}
            <Strong>make it easy enough that you&apos;ll actually do it.</Strong>
          </P>
          <P>
            Don&apos;t plan B-roll. Don&apos;t build a pillar framework. Don&apos;t wait until
            you feel confident. Write in your own words, let AI sharpen it, film like
            you&apos;re on FaceTime, and post. The polish comes from reps, and the reps only
            happen if the process is light enough to repeat.
          </P>
          <P>
            If you have a question that isn&apos;t on this list, drop it in the community.
            That&apos;s how this page happened.
          </P>
          <p className="font-script text-2xl text-[var(--accent)] mt-8">Naya</p>
        </article>
      </main>
      <Footer />
    </>
  );
}

import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import { Suspense } from "react";
import RegisteredTracker from "./RegisteredTracker";
import { THANK_YOU_SLUGS, type ThankYouOffer } from "./slugs";
import CommunityUpsell from "./CommunityUpsell";

export const metadata = {
  title: "You're In | AI Video Editing Plugin",
  description: "Your purchase went through. Check your inbox for the next step.",
  robots: { index: false, follow: false },
};

const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" +
  encodeURIComponent("Build Your AI Video Editing Team (Live Workshop with Naya)") +
  "&dates=20261024T190000Z/20261024T220000Z" +
  "&details=" +
  encodeURIComponent(
    "Live build-along workshop. The join link arrives by email from Naya before the session. Bring a folder with 10 to 20 raw clips and a few voice memos.\n\nhttps://www.theblackfemaleengineer.com/ai-video-editor-workshop"
  );

const prep = [
  {
    title: "Pick one recent Reel to rebuild.",
    detail:
      "Put its raw clips in a single folder. Ten to twenty clips is plenty. This is the footage your team will work with live.",
  },
  {
    title: "Record the script line by line.",
    detail:
      "One voice memo per line, two or three takes each. Voice picks the best take of every line, so do not record one giant file.",
  },
];

const pluginSteps = [
  {
    title: "Open the link in your Grok account.",
    detail:
      "The plugin runs in Grok Bot. Any xAI subscription or usage charges are billed by xAI and are separate from this purchase.",
  },
  {
    title: "Give the coordinator a folder.",
    detail:
      "Ten to twenty raw clips and a few voice memos, one line per memo. Tell it your rules in plain English, or keep mine and change them as you go.",
  },
  {
    title: "Approve, then send notes by clip number.",
    detail:
      "You approve the storyboard and the mockup, review the version it hands back, and send one note per fix.",
  },
];

function offerFrom(value: string | string[] | undefined): ThankYouOffer {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === "plugin" || v === "membership") return v;
  return "workshop";
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkshopThankYouPage({ searchParams }: Props) {
  const params = await searchParams;
  const offer = offerFrom(params.offer);
  const { slug } = THANK_YOU_SLUGS[offer];

  return (
    <>
      <PagePresenceTracker page={slug} />
      <RegisteredTracker offer={offer} />
      <Navigation />
      <main className="pt-42 md:pt-50 min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          {offer === "plugin" && <PluginThankYou />}
          {offer === "membership" && <MembershipThankYou />}
          {offer === "workshop" && <WorkshopThankYou />}
          <p className="text-sm text-[var(--gray-600)] mb-8">
            Questions? Email{" "}
            <a
              href="mailto:theblackfemaleengineer@gmail.com"
              className="text-[var(--accent)] hover:underline"
            >
              theblackfemaleengineer@gmail.com
            </a>
            .
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-[var(--card-border)] text-[var(--foreground)] px-6 py-3 rounded-full font-medium hover:bg-[var(--gray-50)] transition-colors"
          >
            Back to home
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs font-medium px-4 py-1.5 rounded-full bg-[var(--cta-bg)] text-white mb-6 tracking-wide">
      {children}
    </span>
  );
}

function PluginThankYou() {
  return (
    <>
      <Badge>PLUGIN PURCHASED</Badge>
      <h1 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
        Your plugin is on its way.
      </h1>
      <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-6">
        Your payment went through. The link to your AI Video Editing Plugin is
        in your inbox now, from naya@theblackfemaleengineer.com. Check spam if
        you do not see it within a few minutes.
      </p>
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 mb-8 text-left">
        <h2 className="font-serif font-bold text-lg mb-1">Three steps to set it up</h2>
        <p className="text-sm text-[var(--gray-600)] mb-4">
          Everything you need is in the email. This is the short version.
        </p>
        <ol className="space-y-4 text-sm text-[var(--gray-600)]">
          {pluginSteps.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-[var(--accent)] font-bold">{i + 1}.</span>
              <span>
                <strong className="text-[var(--foreground)]">{item.title}</strong>{" "}
                {item.detail}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <Suspense fallback={null}>
        <CommunityUpsell />
      </Suspense>
    </>
  );
}

function MembershipThankYou() {
  return (
    <>
      <Badge>MEMBERSHIP ACTIVE</Badge>
      <h1 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
        You&apos;re in Disgustingly Paid.
      </h1>
      <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-6">
        Your $99 a month membership is set, billed through Stripe. A receipt and
        your welcome email are on their way, and the welcome email has your AI
        Video Editing Plugin link.
      </p>
      <div className="bg-[var(--card-bg)] border-2 border-[var(--accent)] rounded-2xl p-6 mb-8 text-left">
        <p className="font-medium text-[var(--foreground)]">What happens next</p>
        <ul className="mt-3 space-y-3 text-sm text-[var(--gray-600)] leading-relaxed">
          <li className="flex items-start gap-3">
            <span className="text-[var(--accent)] font-bold">1.</span>
            <span>
              <strong className="text-[var(--foreground)]">Your Skool invite comes from Naya within 24 hours.</strong>{" "}
              Look for an email from Skool with a Join button. You never pay
              anything on Skool itself.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[var(--accent)] font-bold">2.</span>
            <span>
              <strong className="text-[var(--foreground)]">Open the plugin in your Grok account.</strong>{" "}
              The link is in your welcome email. The plugin runs in Grok Bot,
              and any xAI charges are separate.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[var(--accent)] font-bold">3.</span>
            <span>
              <strong className="text-[var(--foreground)]">Need to pause or cancel?</strong>{" "}
              Reply to any email from Naya and it is handled the same day.
            </span>
          </li>
        </ul>
      </div>
    </>
  );
}

function WorkshopThankYou() {
  return (
    <>
      <Badge>SEAT SAVED</Badge>
      <h1 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
        You&apos;re in.
      </h1>
      <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-6">
        Your seat for the live workshop is saved. A receipt is on its way to
        your inbox right now.
      </p>
      <div className="bg-[var(--surface-warm)] border border-[var(--border-warm)] rounded-2xl p-5 mb-8 text-left">
        <p className="font-medium text-[var(--foreground)]">
          Your plugin is on its way.
        </p>
        <p className="text-sm text-[var(--gray-600)] leading-relaxed mt-1">
          The plugin is included with your ticket. Check your inbox (and your
          spam folder) for an email from naya@theblackfemaleengineer.com with
          the link to the exact setup behind my AI editing team.
        </p>
        <p className="text-sm text-[var(--gray-600)] leading-relaxed mt-2">
          Open it in your Grok account and start building. On October 24, we
          customize it to your content and your style together.
        </p>
      </div>
      <Suspense fallback={null}>
        <CommunityUpsell />
      </Suspense>
      <div className="bg-[var(--card-bg)] border-2 border-[var(--accent)] rounded-2xl p-6 mb-8">
        <p className="text-xs tracking-widest text-[var(--gray-600)] mb-2">
          WE GO LIVE
        </p>
        <p className="font-serif font-bold text-2xl md:text-3xl">
          Saturday, October 24, 2026
        </p>
        <p className="text-[var(--gray-600)] mt-1">
          3:00 PM Eastern · 12:00 PM Pacific · 8:00 PM UK
        </p>
        <a
          href={CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 bg-[var(--cta-bg)] text-white px-6 py-3 rounded-full font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          Add to Google Calendar
        </a>
        <p className="text-xs text-[var(--gray-600)] mt-3">
          The join link comes by email before the session.
        </p>
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 mb-8 text-left">
        <h2 className="font-serif font-bold text-lg mb-1">
          Two things to do before October 24
        </h2>
        <p className="text-sm text-[var(--gray-600)] mb-4">
          Takes about 15 minutes. People who do this leave the session with a
          team that is already editing their real footage.
        </p>
        <ul className="space-y-4 text-sm text-[var(--gray-600)]">
          {prep.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-[var(--accent)] font-bold">{i + 1}.</span>
              <span>
                <strong className="text-[var(--foreground)]">{item.title}</strong>{" "}
                {item.detail}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm text-[var(--gray-600)] mb-4">
        Can&apos;t make it live anymore? The full recording goes to your inbox
        within 24 hours after the session.
      </p>
    </>
  );
}

import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import { Suspense } from "react";
import RegisteredTracker from "./RegisteredTracker";
import CommunityUpsell from "./CommunityUpsell";

export const metadata = {
  title: "You're In | Build Your AI Video Editing Team",
  description:
    "Your seat is saved for the live workshop on Saturday, October 24 at 3:00 PM ET.",
  robots: { index: false, follow: false },
};

const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" +
  encodeURIComponent("Build Your AI Video Editing Team (Live Workshop with Naya)") +
  "&dates=20261024T190000Z/20261024T210000Z" +
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

export default function WorkshopThankYouPage() {
  return (
    <>
      <PagePresenceTracker page="ai-video-editor-workshop-registered" />
      <RegisteredTracker />
      <Navigation />
      <main className="pt-42 md:pt-50 min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <span className="inline-block text-xs font-medium px-4 py-1.5 rounded-full bg-[var(--cta-bg)] text-white mb-6 tracking-wide">
            SEAT SAVED
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
            You&apos;re <span className="italic text-[var(--accent)]">in</span>!
          </h1>
          <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-6">
            Your seat for the live workshop is saved. A receipt is on its way
            to your inbox right now.
          </p>
          <div className="bg-[var(--surface-warm)] border border-[var(--border-warm)] rounded-2xl p-5 mb-8 text-left flex items-start gap-4">
            <span className="text-3xl leading-none" aria-hidden="true">🎁</span>
            <div>
              <p className="font-medium text-[var(--foreground)]">
                Your bonus is on its way.
              </p>
              <p className="text-sm text-[var(--gray-600)] leading-relaxed mt-1">
                Check your inbox (and your spam folder). I&apos;m sending you
                the exact setup behind my AI editing team: the instructions I
                use to make AI find my best clips, assemble my voiceover, and
                edit my videos.
              </p>
              <p className="text-sm text-[var(--gray-600)] leading-relaxed mt-2">
                Start building your team tonight. On October 24, we&apos;ll
                customize it to your content and your style together. 🤎
              </p>
            </div>
          </div>
          <Suspense fallback={null}>
            <CommunityUpsell />
          </Suspense>
          <div className="bg-[var(--card-bg)] border-2 border-[var(--accent)] rounded-2xl p-6 mb-8">
            <p className="text-xs tracking-widest text-[var(--gray-600)] mb-2">
              WE GO LIVE
            </p>
            <p className="font-serif text-2xl md:text-3xl">
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
            <h2 className="font-serif text-lg mb-1">
              Two things to do before October 24
            </h2>
            <p className="text-sm text-[var(--gray-600)] mb-4">
              Takes about 15 minutes. People who do this leave the session
              with a team that is already editing their real footage.
            </p>
            <ul className="space-y-4 text-sm text-[var(--gray-600)]">
              {prep.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[var(--accent)] font-bold">{i + 1}.</span>
                  <span>
                    <strong className="text-[var(--foreground)]">
                      {item.title}
                    </strong>{" "}
                    {item.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-[var(--gray-600)] mb-8">
            Can&apos;t make it live anymore? No problem. The full recording and
            every template go to your inbox within 24 hours of the session.
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

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import Image from "next/image";
import PageViewTracker from "./PageViewTracker";
import RegisterButton from "./RegisterButton";
import EventCountdown from "./EventCountdown";
import FAQAccordion from "./FAQAccordion";
import StickyBar from "./StickyBar";
import PhoneVideo from "./PhoneVideo";
import BonusOffer from "./BonusOffer";
import DemoVideo from "./DemoVideo";

const TITLE = "Build Your AI Video Editing Team | Live Workshop with Naya";
const DESCRIPTION =
  "A live three-hour build on Saturday, October 24 at 3:00 PM ET. Leave with five AI assistants that find your clips, assemble your voiceover, reject footage that breaks your rules, and cut your Reels. $147, recording included, show-up guarantee.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/ai-video-editor-workshop",
    type: "website",
    images: [
      {
        url: "/images/work-with-us.jpg",
        alt: "Naya being filmed for a creator shoot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/work-with-us.jpg"],
  },
};

const options = [
  {
    name: "Do it yourself",
    cost: "Hours per Reel, forever",
    lines: [
      "Three to five hours per Reel: finding clips, picking takes, moving captions",
      "Every project starts from a blank timeline",
    ],
    highlight: false,
  },
  {
    name: "Hire an editor",
    cost: "Thousands per month",
    lines: [
      "Hundreds per Reel, thousands a month",
      "You explain your taste on every project and still get chewing footage back",
    ],
    highlight: false,
  },
  {
    name: "Build your team",
    cost: "$147, once",
    lines: [
      "One afternoon to set up, then it runs on every project",
      "Your rules apply on every clip. You approve the storyboard, the mockup, and the render.",
    ],
    highlight: true,
  },
];

const team = [
  {
    name: "Voice",
    role: "Assembles your voiceover",
    description:
      "Picks the best take of each line and layers them so the next line starts as the last word ends.",
    blame: "A word cut off halfway through?",
  },
  {
    name: "Scout",
    role: "Finds the footage",
    description:
      "Searches your project folder and footage library for the clips the storyboard needs.",
    blame: "Bad angle?",
  },
  {
    name: "QA",
    role: "Screens every clip",
    description:
      "Checks light, sharpness, angles, and your rules. Pass or fail.",
    blame: "Chewing footage made it in?",
  },
  {
    name: "Cuts",
    role: "Edits the video",
    description:
      "Storyboard, mockups, render, captions, stickers.",
    blame: "Sticker covering a word?",
  },
];

const schedule = [
  { time: "3:00", title: "Doors open", detail: "Watch my team edit a real Reel, start to finish." },
  { time: "3:15", title: "Set up the five roles", detail: "Paste my job descriptions, then make them yours." },
  { time: "3:50", title: "Your folder, your rules", detail: "Voice memos line by line. Start your playbook from mine." },
  { time: "4:30", title: "Teach it your style", detail: "Reference Reel, then mockups before renders." },
  { time: "5:00", title: "Build the review loop", detail: "Versions, phone previews, notes by clip number." },
  { time: "5:30", title: "Live Q&A", detail: "Bring the edit you are stuck on. We wrap at 6:00." },
];

const included = [
  {
    title: "The live build, October 24 at 3:00 PM ET",
    detail: "Three hours with live Q&A. You leave with your team already running on your footage.",
  },
  {
    title: "Five job descriptions, ready to paste",
    detail: "Voice, Scout, QA, Cuts, and the Coordinator. Paste them in and they work tonight.",
  },
  {
    title: "My full rules playbook",
    detail: "Light, angles, captions, stickers, proof, pacing. Keep what fits your face and delete the rest.",
  },
  {
    title: "The review workflow",
    detail: "Storyboards, versions, phone previews. You review one version and send notes by clip number.",
  },
  {
    title: "The full recording, yours to keep",
    detail: "In your inbox within 24 hours after the workshop, so you can rebuild any step at your own pace.",
  },
];

const LABEL = "text-sm font-medium";

function Label({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`${LABEL} mb-3 ${dark ? "text-[var(--deck-rose)]" : "text-[var(--accent)]"}`}>
      {children}
    </p>
  );
}

function SectionHeading({
  eyebrow,
  title,
  lede,
  dark = false,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  dark?: boolean;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <div className={`${centered ? "text-center mx-auto" : ""} max-w-2xl mb-12 md:mb-16`}>
      <Label dark={dark}>{eyebrow}</Label>
      <h2 className={`font-serif font-bold text-3xl md:text-5xl leading-[1.1] ${dark ? "text-white" : "text-[var(--foreground)]"}`}>
        {title}
      </h2>
      {lede && (
        <p className={`mt-5 text-base md:text-lg leading-relaxed ${dark ? "text-white/60" : "text-[var(--gray-600)]"}`}>
          {lede}
        </p>
      )}
    </div>
  );
}

const SECTION = "py-16 md:py-28";
const CONTAINER = "max-w-6xl mx-auto px-5 sm:px-6 lg:px-8";

export default function AIVideoEditorWorkshopPage() {
  return (
    <>
      <PagePresenceTracker page="ai-video-editor-workshop" />
      <PageViewTracker />
      <Navigation />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: "Build Your AI Video Editing Team: Live Workshop",
          description: DESCRIPTION,
          startDate: "2026-10-24T15:00:00-04:00",
          endDate: "2026-10-24T18:00:00-04:00",
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          location: {
            "@type": "VirtualLocation",
            url: "https://www.theblackfemaleengineer.com/ai-video-editor-workshop",
          },
          organizer: {
            "@type": "Organization",
            name: "The Black Female Engineer",
            url: "https://www.theblackfemaleengineer.com",
          },
          performer: { "@type": "Person", name: "Nyaradzo Bere" },
          offers: {
            "@type": "Offer",
            price: "147",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: "https://www.theblackfemaleengineer.com/ai-video-editor-workshop#register",
            validFrom: "2026-10-10",
          },
        }}
      />
      <StickyBar />
      <main className="bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
        {/* Hero: the walkthrough */}
        <section id="hero" className="pt-32 md:pt-44 pb-16 md:pb-24">
          <div className={CONTAINER}>
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center text-sm font-medium px-4 py-1.5 rounded-full bg-[var(--cta-bg)] text-white mb-7">
                <span className="sm:hidden">Live workshop, Sat Oct 24, 3 PM ET</span>
                <span className="hidden sm:inline">Live workshop, Saturday October 24, 3:00 PM ET</span>
              </div>
              <h1 className="font-serif font-bold text-[2.6rem] leading-[1.05] sm:text-5xl lg:text-6xl">
                Editing has become the worst part of content creation.
              </h1>
              <p className="mt-5 md:mt-6 text-xl md:text-2xl text-[var(--accent)] font-medium">
                That&apos;s why I stopped doing it.
              </p>
            </div>

            <div className="mt-10 md:mt-14">
              <DemoVideo />
              <p className="mt-4 text-center text-sm text-[var(--gray-600)]">
                My AI Video Editor Bot in Grok Bot, from folder to finished Reel.
                On October 24 you build the same team, tuned to your rules.
              </p>
            </div>

            <div className="max-w-3xl mx-auto text-center">
              <p className="mt-10 md:mt-14 text-lg md:text-xl text-[var(--gray-600)] leading-relaxed max-w-2xl mx-auto">
                Holding an audience&apos;s attention now takes:
              </p>
              <ul className="mt-5 flex flex-wrap justify-center gap-2 md:gap-2.5 max-w-3xl mx-auto">
                {[
                  "A cut every few seconds",
                  "Text on screen",
                  "Sound effects",
                  "Pop-ups",
                  "Zooms",
                ].map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2 text-sm md:text-base font-medium text-[var(--foreground)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-lg md:text-xl text-[var(--gray-600)] leading-relaxed max-w-2xl mx-auto">
                It is too much for one person who also has to film the thing.
              </p>
              <p className="mt-4 text-lg md:text-xl text-[var(--foreground)] font-medium leading-relaxed max-w-2xl mx-auto">
                What if you could give AI the content you love and have it edit
                your videos in that exact same style?
              </p>
              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <RegisterButton location="hero" />
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 text-[var(--foreground)] font-medium px-2 py-3 hover:text-[var(--accent)] transition-colors"
                >
                  Meet the team
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </a>
              </div>
              <div className="mt-5 flex justify-center">
                <EventCountdown />
              </div>
              <p className="mt-8 text-sm text-[var(--gray-600)] leading-relaxed max-w-xl mx-auto">
                Taught by Naya, who built a 200,000-follower audience on video,
                earned over $500,000 from it, and has partnered with Microsoft,
                Adobe, LinkedIn, HP, and Anthropic.
              </p>
            </div>


            <div className="mt-10 md:mt-14 max-w-2xl mx-auto">
              <BonusOffer variant="card" />
            </div>

          </div>
        </section>

        {/* The problem, in her words */}
        <section className={`bg-[var(--gray-50)] ${SECTION}`}>
          <div className={CONTAINER}>
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
              <div className="lg:col-span-5">
                <Label>For creators with opinions about how they look on camera</Label>
                <h2 className="font-serif font-bold text-3xl md:text-5xl leading-[1.1]">
                  One Reel costs you three to five hours.
                </h2>
                <div className="mt-6 space-y-4 text-lg text-[var(--gray-600)] leading-relaxed">
                  <p>
                    A folder with 100 clips. A voice memo with seven takes of
                    one line. The same three seconds on loop until you can no
                    longer tell what a normal video looks like.
                  </p>
                  <p>
                    You have rules. Eye-level angles. Natural light. No footage
                    of you chewing. Each one costs you another hour, because
                    you are the only person enforcing them.
                  </p>
                  <p className="text-[var(--foreground)] font-medium">
                    That is the job the team takes over.
                  </p>
                </div>
              </div>
              <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 md:p-7">
                  <p className={`${LABEL} text-[var(--gray-600)]`}>A Reel, today</p>
                  <ul className="mt-4 space-y-3 text-sm md:text-[15px] text-[var(--gray-600)] leading-relaxed">
                    {[
                      "Scrub 100 clips looking for the good angle",
                      "Pick the best take of every line by ear",
                      "Lay captions, move captions, fix captions",
                      "Render, watch, notice the sticker over a word, render again",
                      "Three to five hours, then post it unsure",
                    ].map((line) => (
                      <li key={line} className="flex gap-3">
                        <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[var(--gray-400)] flex-shrink-0" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-[var(--accent)] bg-[var(--card-bg)] p-6 md:p-7">
                  <p className={`${LABEL} text-[var(--accent)]`}>A Reel, after October 24</p>
                  <ul className="mt-4 space-y-3 text-sm md:text-[15px] text-[var(--foreground)] leading-relaxed">
                    {[
                      "Drop the folder and your notes with the coordinator",
                      "Approve a storyboard and a mockup",
                      "Get v1 with a phone preview",
                      "Send one note: \u201cClip 7: different angle.\u201d",
                      "Approve v1b. Post it.",
                    ].map((line) => (
                      <li key={line} className="flex gap-3">
                        <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[var(--cta-bg)] flex-shrink-0" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <RegisterButton location="problem" label="Build my team for $147" wrapperClassName="w-full" className="inline-flex w-full items-center justify-center gap-2 bg-[var(--cta-bg)] text-white px-6 py-3.5 rounded-full font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-70" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The cost of your standards */}
        <section className={`bg-[var(--dark-section-bg)] ${SECTION}`}>
          <div className={CONTAINER}>
            <SectionHeading
              dark
              eyebrow="The math"
              title={<>Your standards are expensive.</>}
              lede="At three Reels a week, editing them yourself is 10 to 15 hours. Every week. Three ways to get that time back."
            />
            <div className="grid md:grid-cols-3 gap-4 md:gap-5">
              {options.map((opt, idx) => (
                <div
                  key={opt.name}
                  className={`rounded-2xl p-7 md:p-8 flex flex-col ${
                    opt.highlight
                      ? "bg-[var(--cta-bg)] text-white"
                      : "bg-white/[0.03] border border-white/10 text-white/80"
                  }`}
                >
                  <p className={`${LABEL} ${opt.highlight ? "text-white/70" : "text-white/50"}`}>
                    Option {idx + 1}
                  </p>
                  <h3 className="font-serif font-bold text-2xl md:text-[1.7rem] mt-3 text-white leading-tight">
                    {opt.name}
                  </h3>
                  <p className={`mt-1 text-sm ${opt.highlight ? "text-white/80" : "text-[var(--deck-rose)]"}`}>
                    {opt.cost}
                  </p>
                  <ul className="mt-6 pt-5 border-t border-white/15 space-y-2.5 text-sm leading-relaxed">
                    {opt.lines.map((line, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className={`mt-[9px] w-1 h-1 rounded-full flex-shrink-0 ${opt.highlight ? "bg-white" : "bg-white/40"}`} />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  {opt.highlight && (
                    <p className="mt-auto pt-6 text-sm font-medium text-white/80">
                      The one that scales.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The team */}
        <section id="how-it-works" className={`${SECTION} scroll-mt-24`}>
          <div className={CONTAINER}>
            <SectionHeading
              eyebrow="How it works"
              title="Meet the team you will build."
              lede="Four specialists, one job each. One coordinator, the only one you ever talk to. When something is wrong, you know exactly who to send it back to."
            />
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              <div className="lg:col-span-4 flex justify-center lg:sticky lg:top-32">
                <div className="relative w-[240px] sm:w-[260px] aspect-[9/19] rounded-[2.4rem] bg-[var(--dark-section-bg)] p-2 shadow-[0_24px_60px_rgba(42,38,37,0.22)]">
                  <div className="relative w-full h-full rounded-[1.9rem] overflow-hidden bg-[var(--dark-card-bg)]">
                    <PhoneVideo />
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                    <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between text-white text-[11px] font-medium pointer-events-none">
                      <span className="bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">v1c · approved</span>
                      <span className="bg-[var(--cta-bg)] px-2.5 py-1 rounded-full">QA: pass</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="rounded-2xl border border-[var(--accent)] bg-[var(--card-bg)] p-6 md:p-8">
                  <p className={`${LABEL} text-[var(--accent)]`}>The only one you talk to</p>
                  <h3 className="font-poppins font-bold tracking-[-0.02em] text-3xl md:text-4xl mt-3 leading-none">
                    Coordinator
                  </h3>
                  <p className="mt-4 text-[var(--gray-600)] leading-relaxed">
                    You never need to brief Voice, Scout, QA, or Cuts. Drop your
                    folder and notes with the coordinator. It assigns the work,
                    checks it against your rules, and hands you one version to
                    review.
                  </p>
                  <ol className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-[var(--foreground)]">
                    {[
                      <>You: &ldquo;Clip 7: different angle.&rdquo;</>,
                      <>Coordinator sends it to Scout, then QA.</>,
                      <>Cuts re-renders. Coordinator checks it.</>,
                      <>You get v1b with a phone preview.</>,
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-medium text-[var(--accent)] w-4 flex-shrink-0">{i + 1}.</span>
                        <span className="text-[var(--gray-600)]">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <ul className="mt-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] divide-y divide-[var(--card-border)]">
                  {team.map((member) => (
                    <li key={member.name} className="grid sm:grid-cols-[9rem_1fr] gap-1 sm:gap-6 px-6 md:px-8 py-5 md:py-6">
                      <div>
                        <h3 className="font-poppins font-bold tracking-[-0.02em] text-xl md:text-2xl leading-none">
                          {member.name}
                        </h3>
                        <p className="mt-1.5 text-xs text-[var(--gray-600)]">{member.role}</p>
                      </div>
                      <div>
                        <p className="text-sm md:text-[15px] text-[var(--gray-600)] leading-relaxed">
                          {member.description}
                        </p>
                        <p className="hidden md:block mt-2 text-xs text-[var(--gray-600)]">
                          {member.blame}{" "}
                          <span className="text-[var(--foreground)] font-medium">
                            The coordinator sends it to {member.name}.
                          </span>
                        </p>
                      </div>
                    </li>
                  ))}
                  <li className="grid sm:grid-cols-[9rem_1fr] gap-1 sm:gap-6 px-6 md:px-8 py-5 md:py-6 bg-[var(--surface-warm)] rounded-b-2xl">
                    <div>
                      <h3 className="font-poppins font-bold tracking-[-0.02em] text-xl md:text-2xl leading-none text-[var(--accent)]">
                        You
                      </h3>
                      <p className="mt-1.5 text-xs text-[var(--gray-600)]">Final say</p>
                    </div>
                    <p className="text-sm md:text-[15px] text-[var(--gray-600)] leading-relaxed">
                      You talk to one assistant. You approve the storyboard and
                      the mockups, and give notes by clip number. You handle the
                      taste.
                    </p>
                  </li>
                </ul>

                <div className="mt-8">
                  <RegisterButton location="team" label="Build mine for $147" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className={`bg-[var(--gray-50)] ${SECTION}`}>
          <div className={CONTAINER}>
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
              <div className="lg:col-span-4">
                <SectionHeading
                  align="left"
                  eyebrow="The afternoon"
                  title="Three hours, minute by minute."
                  lede="Saturday, October 24. All times Eastern."
                />
              </div>
              <ol className="lg:col-span-8 divide-y divide-[var(--card-border)] border-y border-[var(--card-border)]">
                {schedule.map((item, i) => (
                  <li key={i} className="grid grid-cols-[4rem_1fr] sm:grid-cols-[6rem_1fr] gap-4 py-5 md:py-6">
                    <span className="font-poppins font-bold tracking-[-0.02em] text-lg md:text-xl text-[var(--accent)] leading-none pt-1">{item.time}</span>
                    <div>
                      <p className="font-medium text-lg leading-snug">{item.title}</p>
                      <p className="mt-1 text-sm md:text-[15px] text-[var(--gray-600)] leading-relaxed">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Register */}
        <section id="register" className={`${SECTION} scroll-mt-24`}>
          <div className={CONTAINER}>
            <SectionHeading
              eyebrow="Register"
              title="Save your seat."
              lede="One live session, one payment, and everything below is yours to keep."
            />
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-7 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 md:p-10">
                <p className={`${LABEL} text-[var(--gray-600)] mb-6`}>What you get</p>
                <ul className="divide-y divide-[var(--card-border)]">
                  {included.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                      <span className="w-6 h-6 rounded-full bg-[var(--cta-bg)] text-white text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-[var(--foreground)] leading-snug">{item.title}</p>
                        <p className="mt-1 text-sm text-[var(--gray-600)] leading-relaxed">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-5 rounded-2xl border border-[var(--accent)] bg-[var(--card-bg)] p-6 md:p-8 lg:sticky lg:top-32">
                <p className={`${LABEL} text-[var(--accent)]`}>Live on October 24</p>
                <h3 className="font-serif font-bold text-2xl leading-tight mt-2">
                  Build Your AI Video Editing Team
                </h3>
                <p className="mt-1.5 text-sm text-[var(--gray-600)]">
                  Saturday, October 24, 2026 · 3:00 PM ET · 3 hours
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-poppins font-bold tracking-[-0.02em] text-6xl leading-none text-[var(--foreground)]">$147</span>
                  <span className="text-sm text-[var(--gray-600)]">one time</span>
                </div>
                <p className="mt-2 text-sm text-[var(--gray-600)]">
                  Less than most editors charge for one Reel. No subscription,
                  and the team you build edits every Reel after this one.
                </p>
                <div className="mt-6">
                  <BonusOffer variant="compact" />
                </div>
                <div className="mt-5">
                  <RegisterButton
                    location="card"
                    label="Save my seat"
                    wrapperClassName="w-full"
                    className="inline-flex w-full items-center justify-center gap-2 bg-[var(--cta-bg)] text-white px-6 py-4 rounded-full font-medium hover:bg-[var(--accent-hover)] transition-colors text-base disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="mt-4">
                  <EventCountdown />
                </div>
                <div className="mt-6 pt-6 border-t border-[var(--card-border)] flex items-start gap-3 text-sm text-[var(--gray-600)] leading-relaxed">
                  <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                  <p>
                    <span className="font-medium text-[var(--foreground)]">Show-up guarantee.</span>{" "}
                    If you leave without your team set up, email me within 48
                    hours for a full refund.
                  </p>
                </div>
                <p className="mt-5 text-xs text-[var(--gray-600)]">
                  Secure checkout by Stripe. Receipt and calendar details arrive
                  by email right after.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Guarantee */}
        <section className="pb-16 md:pb-28">
          <div className={CONTAINER}>
            <div className="rounded-2xl bg-[var(--cta-bg)] text-white p-8 md:p-12 grid md:grid-cols-12 gap-6 md:gap-10 items-center">
              <div className="md:col-span-8">
                <p className={`${LABEL} text-white/70`}>The show-up guarantee</p>
                <h2 className="font-serif font-bold text-2xl md:text-4xl leading-tight mt-2">
                  Leave with your team running, or get the $147 back.
                </h2>
                <p className="mt-4 text-white/80 leading-relaxed max-w-2xl">
                  Come to the live session. If you walk out without your five
                  assistants set up and working on your footage, email me within
                  48 hours and I refund the full amount. No form, no call.
                </p>
              </div>
              <div className="md:col-span-4 md:justify-self-end">
                <RegisterButton location="guarantee" label="Save my seat for $147" wrapperClassName="w-full md:w-auto" className="inline-flex w-full items-center justify-center gap-2 bg-white text-[var(--cta-bg)] px-6 py-3.5 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-70" />
              </div>
            </div>
          </div>
        </section>

        {/* Instructor */}
        <section className={`bg-[var(--gray-50)] ${SECTION}`}>
          <div className={CONTAINER}>
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-5">
                <div className="relative aspect-[4/5] w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-[var(--card-bg)]">
                  <Image
                    src="/images/nyaradzo.jpg"
                    alt="Naya"
                    fill
                    sizes="(max-width: 1024px) 384px, 40vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="lg:col-span-7">
                <Label>Your instructor</Label>
                <h2 className="font-serif font-bold text-3xl md:text-5xl leading-[1.1]">
                  Who is teaching this.
                </h2>
                <p className="mt-6 text-lg text-[var(--gray-600)] leading-relaxed">
                  I&apos;m Naya. I built a 200,000+ person audience on video
                  while working as a software engineer, then as an AI engineer.
                  My platform has earned me over $500,000 and put me in rooms
                  with Microsoft, Adobe, HP, and Anthropic.
                </p>
                <p className="mt-4 text-lg text-[var(--gray-600)] leading-relaxed">
                  I have disgustingly high standards for how I look online, so
                  I built a team that edits my way. This workshop is that
                  build, start to finish, with you doing it alongside me.
                </p>
                <div className="mt-10 pt-8 border-t border-[var(--card-border)]">
                  <p className={`${LABEL} text-[var(--gray-600)] mb-4`}>Previous partnerships</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 font-poppins font-bold tracking-[-0.02em] text-lg text-[var(--gray-400)]">
                    <span>Amazon</span>
                    <span>Microsoft</span>
                    <span>Adobe</span>
                    <span>LinkedIn</span>
                    <span>HP</span>
                    <span>Anthropic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={`bg-[var(--dark-section-bg)] ${SECTION}`}>
          <div className={CONTAINER}>
            <SectionHeading dark eyebrow="FAQ" title="Questions, answered." />
            <FAQAccordion />
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[var(--dark-section-bg)] border-t border-white/10 py-24 md:py-32">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
            <Label dark>One afternoon</Label>
            <h2 className="font-serif font-bold text-4xl md:text-6xl leading-[1.08] text-white">
              Your next Reel, edited by a team that already knows your rules.
            </h2>
            <p className="mt-6 text-lg text-white/60 max-w-xl mx-auto">
              Saturday, October 24 at 3:00 PM ET. Bring your footage and leave
              with your team set up. If you show up live and leave without it,
              email me within 48 hours for a full refund.
            </p>
            <div className="mt-10 flex justify-center">
              <RegisterButton location="final" />
            </div>
            <div className="mt-6 flex justify-center">
              <EventCountdown variant="dark" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

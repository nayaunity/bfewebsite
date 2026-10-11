import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import { ChromeStar, PinkFolder, PolaroidFrame } from "@/components/brand";
import PageViewTracker from "./PageViewTracker";
import RegisterButton from "./RegisterButton";
import EventCountdown from "./EventCountdown";
import FAQAccordion from "./FAQAccordion";
import StickyBar from "./StickyBar";
import PhoneVideo from "./PhoneVideo";
import BonusOffer from "./BonusOffer";

const TITLE = "Build Your AI Video Editing Team | Live Workshop with Naya";
const DESCRIPTION =
  "A live build-along workshop on Saturday, October 24 at 3:00 PM ET. Leave with five AI assistants that find your footage, assemble your voiceover, screen every clip against your standards, and edit your Reels. $147.";

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
      "Three to five hours per video",
      "Every project starts from a blank timeline",
    ],
    highlight: false,
  },
  {
    name: "Hire an editor",
    cost: "Thousands per month",
    lines: [
      "Hundreds per Reel, thousands a month",
      "Still explaining your taste every time",
    ],
    highlight: false,
  },
  {
    name: "Build your team",
    cost: "$147, once",
    lines: [
      "One afternoon to set up, then it runs on every project",
      "Your rules applied automatically. You approve.",
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
  { time: "3:10", title: "Set up the five roles", detail: "Paste my job descriptions, then make them yours." },
  { time: "3:45", title: "Your folder, your rules", detail: "Voice memos line by line. Start your playbook from mine." },
  { time: "4:20", title: "Teach it your style", detail: "Reference Reel, then mockups before renders." },
  { time: "4:35", title: "Build the review loop", detail: "Versions, phone previews, notes by clip number." },
  { time: "4:50", title: "Live Q&A", detail: "Bring the edit you are stuck on." },
];

const included = [
  {
    title: "Bonus: my exact editing team setup, sent the moment you register",
    detail: "Start building tonight. We customize it together live.",
  },
  {
    title: "The live build, October 24 at 3:00 PM ET",
    detail: "About two hours, with live Q&A.",
  },
  {
    title: "Five job descriptions, ready to paste",
    detail: "Voice, Scout, QA, Cuts, and the Coordinator.",
  },
  {
    title: "My full rules playbook",
    detail: "Light, angles, captions, stickers, proof, pacing.",
  },
  {
    title: "The review workflow",
    detail: "Storyboards, versions, phone previews, notes by clip number.",
  },
  {
    title: "The full recording, yours to keep",
    detail: "In your inbox within 24 hours.",
  },
];

function Sticker({
  children,
  className = "",
  rotate = 0,
}: {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full px-4 py-2 shadow-[0_8px_24px_rgba(42,38,37,0.14)] text-sm font-medium text-[var(--foreground)] whitespace-nowrap ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </div>
  );
}

function Stripes({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute bg-[repeating-linear-gradient(135deg,var(--cta-bg)_0_10px,transparent_10px_22px)] opacity-[0.07] ${className}`}
    />
  );
}

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
          endDate: "2026-10-24T17:00:00-04:00",
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
        {/* Hero */}
        <section id="hero" className="relative bg-gradient-to-b from-[var(--background)] to-[var(--surface-warm)] pt-36 md:pt-48 pb-20 md:pb-28 overflow-hidden">
          <Stripes className="-top-10 -right-24 w-[420px] h-[420px] rounded-full hidden lg:block" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              <div className="relative lg:col-span-7">
                <ChromeStar
                  size={56}
                  rotate={15}
                  className="absolute -top-12 right-2 md:right-16 lg:right-24 animate-twinkle"
                />
                <div className="inline-flex items-center gap-2 text-xs font-medium px-4 py-1.5 rounded-full bg-[var(--cta-bg)] text-white mb-6 tracking-wide">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE WORKSHOP · SAT, OCT 24 · 3:00 PM ET
                </div>
                <h1 className="font-serif font-bold text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
                  Stop editing your Reels.
                  <br />
                  Start{" "}
                  <span className="italic font-normal text-[var(--accent)]">
                    approving
                  </span>{" "}
                  them.
                </h1>
                <p className="mt-7 text-lg md:text-xl text-[var(--gray-600)] leading-relaxed max-w-xl">
                  Build a five-assistant AI editing team with me, live. It
                  finds your footage, assembles your voiceover, screens every
                  clip, and cuts the video. You keep the final say.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <RegisterButton location="hero" />
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 text-[var(--accent)] font-medium hover:underline"
                  >
                    See the team work
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </a>
                </div>
                <div className="mt-5">
                  <EventCountdown />
                </div>
                <div className="mt-8">
                  <BonusOffer variant="card" />
                </div>
                <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-sm text-[var(--gray-600)]">
                  <span>
                    <strong className="block text-[var(--foreground)] font-serif text-3xl leading-none mb-1">
                      200k+
                    </strong>
                    followers built on video
                  </span>
                  <span>
                    <strong className="block text-[var(--foreground)] font-serif text-3xl leading-none mb-1">
                      $500k+
                    </strong>
                    earned as a creator
                  </span>
                  <span>
                    <strong className="block text-[var(--foreground)] font-serif text-3xl leading-none mb-1">
                      $147
                    </strong>
                    one time, recording included
                  </span>
                </div>
              </div>

              {/* Phone mock */}
              <div className="lg:col-span-5 flex justify-center py-8 lg:py-4">
               <div className="relative w-[270px] sm:w-[300px]">
                <ChromeStar size={72} rotate={12} className="absolute -top-8 -right-10 z-20 animate-twinkle" />
                <ChromeStar size={28} rotate={-20} className="absolute top-1/2 -left-12 z-20 animate-twinkle [animation-delay:0.9s]" />
                <PinkFolder size={96} rotate={-8} className="absolute -bottom-4 -left-16 sm:-left-20 z-20" />
                <p className="absolute -bottom-11 -left-16 sm:-left-20 w-24 text-center z-20 font-poppins font-bold tracking-[-0.02em] text-sm leading-tight text-[var(--accent)] rotate-[-8deg]">
                  the project folder
                </p>

                <div className="relative w-full aspect-[9/19] rounded-[2.6rem] bg-[var(--dark-section-bg)] p-2.5 shadow-[0_30px_80px_rgba(42,38,37,0.35)] rotate-[3deg]">
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-[var(--dark-card-bg)]">
                    <PhoneVideo />
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                    <div className="absolute top-4 inset-x-4 flex items-center justify-between text-white text-[11px] font-medium pointer-events-none">
                      <span className="bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">
                        v1c · approved
                      </span>
                      <span className="bg-[var(--cta-bg)] px-2.5 py-1 rounded-full">
                        QA: pass
                      </span>
                    </div>
                  </div>
                </div>

                <Sticker rotate={-5} className="absolute top-[30%] -left-6 sm:-left-20 z-20">
                  <span className="text-[var(--accent)] font-serif">Clip 3:</span> brighter clip
                </Sticker>
                <Sticker rotate={4} className="absolute top-[62%] -right-12 sm:-right-24 z-20">
                  <ChromeStar size={16} /> no chewing footage
                </Sticker>
                <Sticker rotate={-3} className="absolute bottom-[21%] -left-10 sm:-left-24 z-20">
                  <span className="text-[var(--accent)] font-serif">Clip 7:</span> different angle
                </Sticker>
               </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem + comparison */}
        <section className="bg-[var(--dark-section-bg)] py-14 md:py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <div>
                <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
                  <span className="italic">your standards</span>
                  <br />
                  ARE EXPENSIVE.
                </h2>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {options.map((opt, idx) => (
                <div
                  key={opt.name}
                  className={`rounded-2xl p-7 ${
                    opt.highlight
                      ? "bg-[var(--cta-bg)] text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:-translate-y-3"
                      : "border border-white/10 text-white/80"
                  }`}
                >
                  <p className="text-xs tracking-widest opacity-70 mb-2">
                    OPTION {idx + 1}{opt.highlight ? " · THE ONE THAT SCALES" : ""}
                  </p>
                  <h3 className="font-serif text-2xl mb-1 text-white">{opt.name}</h3>
                  <p className={`font-serif text-lg italic mb-5 ${opt.highlight ? "text-white" : "text-[var(--deck-rose)]"}`}>
                    {opt.cost}
                  </p>
                  <ul className="space-y-2 text-sm">
                    {opt.lines.map((line, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`mt-2 w-1 h-1 rounded-full flex-shrink-0 ${opt.highlight ? "bg-white" : "bg-white/40"}`} />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Team */}
        <section id="how-it-works" className="bg-[var(--gray-50)] py-14 md:py-24 scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 md:mb-14">
              <h2 className="font-serif text-4xl md:text-5xl">
                <span className="italic">meet the team</span> YOU WILL BUILD
              </h2>
              <p className="mt-4 text-[var(--gray-600)] max-w-2xl mx-auto text-lg">
                Four specialists, one job each. One coordinator, the only one
                you ever talk to.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              <div className="relative col-span-2 lg:col-span-3 bg-[var(--card-bg)] border-2 border-[var(--accent)] rounded-2xl p-6 md:p-10 grid md:grid-cols-[1fr_auto] gap-6 md:gap-8 items-center shadow-[0_16px_40px_rgba(42,38,37,0.10)]">
                <span className="absolute -top-3 left-8 inline-block text-xs px-4 py-1 rounded-full font-medium bg-[var(--cta-bg)] text-white tracking-wide whitespace-nowrap">
                  THE ONLY ONE YOU TALK TO
                </span>
                <div>
                  <h3 className="font-poppins font-bold tracking-[-0.02em] text-3xl md:text-4xl text-[var(--accent)] leading-none mb-2">
                    Coordinator
                  </h3>
                  <p className="text-xs tracking-widest text-[var(--gray-600)] mb-4">
                    YOUR SINGLE POINT OF CONTACT
                  </p>
                  <p className="text-[var(--gray-600)] leading-relaxed">
                    You never need to brief Voice, Scout, QA, or Cuts. Drop
                    your folder and notes with the coordinator. It assigns the
                    work, checks it against your rules, and hands you one
                    version to review.
                  </p>
                </div>
                <div className="bg-[var(--surface-warm)] border border-[var(--border-warm)] rounded-2xl p-5 text-sm min-w-[240px]">
                  <p className="text-xs tracking-widest text-[var(--gray-600)] mb-3">
                    HOW A NOTE TRAVELS
                  </p>
                  <ol className="space-y-2 text-[var(--foreground)]">
                    <li className="flex gap-2"><span className="font-serif text-[var(--accent)]">1.</span> You: &ldquo;Clip 7: different angle.&rdquo;</li>
                    <li className="flex gap-2"><span className="font-serif text-[var(--accent)]">2.</span> Coordinator sends it to Scout, then QA.</li>
                    <li className="flex gap-2"><span className="font-serif text-[var(--accent)]">3.</span> Cuts re-renders. Coordinator checks it.</li>
                    <li className="flex gap-2"><span className="font-serif text-[var(--accent)]">4.</span> You get v1b with a phone preview.</li>
                  </ol>
                </div>
              </div>
              {team.map((member, i) => (
                <div
                  key={member.name}
                  className="relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 md:p-8 hover:-translate-y-1 hover:shadow-xl transition-all"
                >
                  <span className="absolute -top-3 -left-2 w-9 h-9 rounded-full bg-[var(--cta-bg)] text-white font-serif flex items-center justify-center text-sm rotate-[-8deg] shadow">
                    {i + 1}
                  </span>
                  <h3 className="font-poppins font-bold tracking-[-0.02em] text-2xl md:text-3xl text-[var(--accent)] leading-none mb-2">
                    {member.name}
                  </h3>
                  <p className="text-xs tracking-widest text-[var(--gray-600)] mb-4">
                    {member.role.toUpperCase()}
                  </p>
                  <p className="text-[var(--gray-600)] leading-relaxed text-sm md:mb-5">
                    {member.description}
                  </p>
                  <p className="hidden md:inline-block text-xs text-[var(--foreground)] bg-[var(--surface-warm)] border border-[var(--border-warm)] rounded-full px-3 py-1.5">
                    <span className="text-[var(--gray-600)]">{member.blame}</span>{" "}
                    <strong>The coordinator sends it to {member.name}.</strong>
                  </p>
                </div>
              ))}
              <div className="relative col-span-2 bg-[var(--cta-bg)] text-white rounded-2xl p-6 md:p-8 flex flex-col justify-between overflow-hidden">
                <ChromeStar size={90} rotate={15} className="absolute -top-6 -right-6 opacity-30" />
                <div>
                  <h3 className="font-poppins font-bold tracking-[-0.02em] text-3xl leading-none mb-2">You</h3>
                  <p className="text-xs tracking-widest text-white/70 mb-4">FINAL SAY</p>
                  <p className="text-white/90 leading-relaxed text-sm">
                    You talk to one assistant. You approve the storyboard and
                    the mockups, and give notes by clip number. You handle the
                    taste.
                  </p>
                </div>
                <RegisterButton
                  location="team"
                  label="Build mine for $147"
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 bg-white text-[var(--cta-bg)] px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="bg-[var(--background)] py-14 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="font-serif text-4xl md:text-5xl">
                <span className="italic">the afternoon,</span> MINUTE BY MINUTE
              </h2>
              <p className="mt-4 text-[var(--gray-600)] max-w-2xl mx-auto text-lg">
                Saturday, October 24. All times Eastern.
              </p>
            </div>
            <div className="max-w-3xl mx-auto relative">
              <div className="absolute left-[4.25rem] sm:left-24 top-2 bottom-2 w-px bg-[var(--card-border)]" aria-hidden="true" />
              <ol className="space-y-6">
                {schedule.map((item, i) => (
                  <li key={i} className="grid grid-cols-[3.5rem_1.5rem_1fr] sm:grid-cols-[5rem_2rem_1fr] gap-x-2 sm:gap-x-4 items-start">
                    <span className="font-serif text-xl text-[var(--accent)] pt-3 text-right pr-1">{item.time}</span>
                    <span className="relative flex justify-center pt-5">
                      <span className={`w-3 h-3 rounded-full ${i === 0 || i === schedule.length - 1 ? "bg-[var(--cta-bg)]" : "bg-[var(--card-bg)] border-2 border-[var(--accent)]"}`} />
                    </span>
                    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-6 py-4">
                      <p className="font-serif text-lg">{item.title}</p>
                      <p className="text-sm text-[var(--gray-600)] mt-1 leading-relaxed">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Register */}
        <section id="register" className="relative bg-[var(--gray-50)] py-14 md:py-24 scroll-mt-24 overflow-hidden">
          <Stripes className="-top-20 -left-20 w-[360px] h-[360px] rounded-full hidden lg:block" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="font-serif text-4xl md:text-5xl">
                <span className="italic">save your</span> SEAT
              </h2>
              <p className="mt-4 text-[var(--gray-600)] max-w-2xl mx-auto text-lg">
                One session. One price. Everything included.
              </p>
            </div>
            <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto items-start">
              <div className="lg:col-span-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 md:p-10">
                <p className="text-xs tracking-widest text-[var(--gray-600)] mb-7">
                  WHAT YOU GET
                </p>
                <ul className="space-y-5">
                  {included.map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span className="w-9 h-9 rounded-full bg-[var(--cta-bg)] text-white flex items-center justify-center font-serif text-sm flex-shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-[var(--foreground)] text-lg leading-snug">
                          {item.title}
                        </p>
                        <p className="text-sm text-[var(--gray-600)] leading-relaxed mt-1">
                          {item.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-2 relative bg-[var(--card-bg)] border-2 border-[var(--accent)] rounded-3xl p-8 lg:sticky lg:top-32 shadow-[0_24px_70px_rgba(42,38,37,0.18)]">
                <ChromeStar size={44} rotate={15} className="absolute -top-5 -right-4 animate-twinkle" />
                <span className="absolute -top-3 left-8 inline-block text-xs px-4 py-1 rounded-full font-medium bg-[var(--cta-bg)] text-white tracking-wide whitespace-nowrap">
                  LIVE · OCTOBER 24
                </span>
                <div className="mt-3 mb-5">
                  <h3 className="font-serif text-2xl leading-tight mb-1">
                    Build Your AI Video Editing Team
                  </h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Saturday, October 24, 2026 · 3:00 PM ET · about 2 hours
                  </p>
                </div>
                <div className="flex items-end gap-3 mb-1">
                  <span className="font-serif text-7xl text-[var(--accent)] leading-none">
                    $147
                  </span>
                  <span className="text-sm text-[var(--gray-600)] pb-2">one time</span>
                </div>
                <p className="text-sm text-[var(--gray-600)] mb-5">
                  Less than one Reel from most editors. No subscription.
                </p>
                <div className="mb-5">
                  <BonusOffer variant="compact" />
                </div>
                <RegisterButton
                  location="card"
                  label="Save my seat"
                  className="inline-flex w-full items-center justify-center gap-2 bg-[var(--cta-bg)] text-white px-6 py-4 rounded-full font-medium hover:bg-[var(--accent-hover)] transition-colors text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <div className="mt-4">
                  <EventCountdown />
                </div>
                <div className="mt-6 pt-6 border-t border-[var(--card-border)] flex items-start gap-4">
                  <div className="flex-shrink-0 w-20 h-20 rounded-full border-2 border-dashed border-[var(--accent)] flex items-center justify-center text-center rotate-[-10deg]">
                    <span className="font-serif text-[10px] leading-tight text-[var(--accent)] uppercase tracking-wide">
                      Show-up<br />guarantee
                    </span>
                  </div>
                  <p className="text-sm text-[var(--gray-600)] leading-relaxed">
                    Show up live. If you leave without your team set up, email
                    me within 48 hours for a full refund.
                  </p>
                </div>
                <p className="mt-5 text-xs text-[var(--gray-600)] text-center">
                  Secure checkout by Stripe. Receipt and calendar details arrive
                  by email right after.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Instructor */}
        <section className="bg-[var(--background)] py-14 md:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
              <div className="relative flex justify-center order-last lg:order-first">
                <ChromeStar size={64} rotate={10} className="absolute -top-6 right-6 z-10 animate-twinkle" />
                <ChromeStar size={28} rotate={-25} className="absolute bottom-10 -left-2 z-10 animate-twinkle [animation-delay:0.7s]" />
                <PolaroidFrame
                  src="/images/nyaradzo.jpg"
                  alt="Nyaradzo"
                  rotation={-2}
                  className="w-full max-w-sm"
                />
              </div>
              <div>
                <h2 className="font-serif text-4xl md:text-5xl mb-6">
                  <span className="italic">who is</span> TEACHING THIS
                </h2>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-4">
                  I&apos;m Naya. I built a 200,000+ person audience on video
                  while working as a software engineer, then as an AI engineer.
                  My platform has earned me over $500,000 and put me in rooms
                  with Microsoft, Adobe, HP, and Anthropic.
                </p>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed">
                  I have disgustingly high standards for how I look online, so
                  I built a team that edits my way. This workshop is that
                  build, start to finish, with you doing it alongside me.
                </p>
              </div>
            </div>
            <div className="text-center mt-20">
              <p className="text-sm tracking-widest mb-8 text-[var(--gray-600)]">
                PREVIOUS PARTNERSHIPS
              </p>
              <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 font-serif text-3xl md:text-5xl lg:text-6xl text-[var(--gray-400)]">
                <span>AMAZON</span>
                <span className="text-[var(--accent)]">MICROSOFT</span>
                <span>ADOBE</span>
                <span className="text-[var(--accent)]">LINKEDIN</span>
                <span>HP</span>
                <span className="text-[var(--accent)]">ANTHROPIC</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[var(--dark-section-bg)] py-14 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl md:text-5xl text-white">
                <span className="italic">frequently asked</span> QUESTIONS
              </h2>
              <div className="w-px h-12 bg-[var(--deck-rose)] mx-auto my-8"></div>
            </div>
            <FAQAccordion />
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative bg-[var(--dark-section-bg)] border-t border-white/10 py-24 md:py-32 overflow-hidden">
          <ChromeStar size={120} rotate={15} className="absolute -top-10 -left-10 opacity-20" />
          <ChromeStar size={80} rotate={-20} className="absolute bottom-6 right-10 opacity-25 animate-twinkle" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <p className="font-poppins font-bold tracking-[-0.02em] text-xl text-[var(--deck-rose)] mb-4">
              one afternoon
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-6 text-white leading-tight">
              Your next Reel, edited by a team that already knows your rules.
            </h2>
            <p className="text-white/60 mb-10 text-lg max-w-2xl mx-auto">
              Saturday, October 24 at 3:00 PM ET. Bring your footage. Leave
              with your team.
            </p>
            <div className="flex justify-center">
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

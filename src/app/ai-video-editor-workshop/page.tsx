import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import {
  ChromeStar,
  DoodleArrow,
  PinkFolder,
  PolaroidFrame,
} from "@/components/brand";
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

const CHECK = (
  <svg
    className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
      clipRule="evenodd"
    />
  </svg>
);

const marquee = [
  "Voice assembles the voiceover",
  "Scout finds the footage",
  "QA screens every clip",
  "Cuts edits the video",
  "The Coordinator runs the room",
  "You keep the final say",
];

const pains = [
  "Scrubbing through 100+ clips for the one with decent light.",
  "Re-recording a voiceover because the last word got clipped.",
  "Dragging the same caption out from under the same sticker. Again.",
  "Watching the same three seconds until you cannot tell what a normal video looks like.",
  "Explaining your taste to an editor, then fixing the edit yourself anyway.",
];

const options = [
  {
    name: "Do it yourself",
    cost: "Hours per Reel, forever",
    lines: [
      "Three to five hours per video, every video",
      "Your best ideas wait while you scrub clips",
      "Every project starts from a blank timeline",
    ],
    highlight: false,
  },
  {
    name: "Hire an editor",
    cost: "Thousands per month",
    lines: [
      "Hundreds per Reel. Thousands a month. Forever.",
      "Still explaining your taste on every brief",
      "Still fixing the edit yourself at the end",
    ],
    highlight: false,
  },
  {
    name: "Build your team",
    cost: "$147, once",
    lines: [
      "One afternoon to set up. Then it runs on every project.",
      "Your rules written down and applied automatically",
      "Your hours go to what you are good at. The team does the rest.",
    ],
    highlight: true,
  },
];

const team = [
  {
    name: "Voice",
    role: "Assembles your voiceover",
    description:
      "Takes your voice memos one script line at a time, picks the best take of each, and layers them so the next line starts the moment the last word ends.",
    blame: "A word cut off halfway through?",
  },
  {
    name: "Scout",
    role: "Finds the footage",
    description:
      "Reads what the script and storyboard need, then searches your project folder and your footage library. Older footage finally gets used.",
    blame: "Bad angle?",
  },
  {
    name: "QA",
    role: "Screens every clip",
    description:
      "Checks lighting, sharpness, angles, and your written rules. Each clip gets a pass or a fail. Only the shortlist moves on.",
    blame: "Chewing footage made it in?",
  },
  {
    name: "Cuts",
    role: "Edits the video",
    description:
      "Takes the shortlist, the voiceover, and your style reference. Builds the storyboard, mockups, render, captions, and stickers.",
    blame: "Sticker covering a word?",
  },
];

const schedule = [
  { time: "3:00", title: "Doors open", detail: "Meet the team you are about to build and see one of mine edit a real Reel, start to finish." },
  { time: "3:10", title: "Give everyone a job", detail: "Set up the five roles so when something goes wrong you know exactly where to look." },
  { time: "3:25", title: "Write the job descriptions", detail: "What each assistant receives, what it does, and where its work goes next. You paste mine, then edit." },
  { time: "3:45", title: "Make the starting point obvious", detail: "One project folder. Voice memos recorded line by line. Three jobs kick off at the same time." },
  { time: "4:00", title: "Write down your taste", detail: "Turn the notes you keep repeating into rules. You start your list live, using my full playbook as the template." },
  { time: "4:20", title: "Teach it your styles", detail: "Document a reference Reel frame by frame so you can ask for a style by name. Mockups before renders." },
  { time: "4:35", title: "Build the review loop", detail: "Numbered storyboards, version names, phone previews, and notes by clip number." },
  { time: "4:50", title: "Live Q&A", detail: "Bring the edit you are stuck on. We fix the workflow together." },
];

const rules = [
  "Good natural light in every shot.",
  "Eye-level, flattering angles. No up-the-chin footage.",
  "Never open on me walking into frame.",
  "No shots of me chewing.",
  "Captions must match what I actually say, word for word.",
  "Stars and stickers cannot cover words.",
  "A statistic can only appear on screen when I am actually saying it.",
  "The final word has to play in full.",
  "Any pop-up claiming to show proof has to be true.",
];

const included = [
  {
    title: "Bonus: the exact setup behind my AI editing team, sent when you register",
    detail: "The exact instructions I use to make AI find my best clips, assemble my voiceover, and edit my videos. Start setting up your own team today, then we customize it together in the workshop.",
  },
  {
    title: "The live build on Saturday, October 24 at 3:00 PM ET",
    detail: "About two hours. You build alongside me, step by step, with live Q&A at the end.",
  },
  {
    title: "The five job descriptions, ready to paste",
    detail: "Voice, Scout, QA, Cuts, and the Coordinator, each written as what it receives, what it does, and where its work goes.",
  },
  {
    title: "My full rules playbook",
    detail: "Every rule I have written for lighting, angles, captions, stickers, proof, and pacing. Delete what does not apply.",
  },
  {
    title: "The review workflow",
    detail: "Storyboard approvals, mockup checks, version naming, phone previews, and notes by clip number.",
  },
  {
    title: "The full recording, yours to keep",
    detail: "Sent to every registrant within 24 hours. Rebuild at your pace or catch up if you cannot make it live.",
  },
];

const forYou = [
  "You post Reels or short vertical video and have opinions about how you look.",
  "You have given the same editing note at least twice.",
  "You want AI to do the repetitive work while you keep the final say.",
  "You would rather spend the weekend filming the next video than fixing the last one.",
];

const notForYou = [
  "You want AI to invent footage, stats, or receipts. It does not get to.",
  "You want to never look at a video before it posts.",
  "You are hoping to skip the part where you write down what you actually want.",
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
                  In one live afternoon, build a five-assistant AI editing team
                  that finds your footage, assembles your voiceover, screens
                  every clip against your standards, and cuts the video. You
                  give notes by clip number. You keep the final say.
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

        {/* Marquee */}
        <div className="bg-[var(--cta-bg)] text-white py-3 overflow-hidden marquee-mask">
          <div className="flex w-max animate-marquee-editorial whitespace-nowrap">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
                {marquee.map((item, i) => (
                  <span key={i} className="flex items-center gap-6 px-6 text-sm tracking-wide uppercase">
                    {item}
                    <ChromeStar size={16} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* The Problem + comparison */}
        <section className="bg-[var(--dark-section-bg)] py-20 md:py-28 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-16">
              <div>
                <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
                  <span className="italic">your standards</span>
                  <br />
                  ARE EXPENSIVE.
                </h2>
                <div className="w-px h-12 bg-[var(--deck-rose)] my-8"></div>
                <p className="text-white/70 text-lg leading-relaxed mb-4">
                  Right now you have two ways to get a Reel out the door, and
                  both of them are robbing you.
                </p>
                <p className="text-white/70 text-lg leading-relaxed mb-4">
                  <strong className="text-white">Hire an editor</strong> and
                  you are paying hundreds per video and thousands a month for
                  someone who still needs you to explain your taste on every
                  brief. Then you open the export and fix it yourself anyway.
                </p>
                <p className="text-white/70 text-lg leading-relaxed mb-4">
                  <strong className="text-white">Edit it yourself</strong> and
                  every Reel eats three, four, five hours. That is time you
                  were supposed to spend on the thing you are actually good
                  at: the idea, the camera, the business, the audience.
                  Instead you are nudging captions at 11 PM.
                </p>
                <p className="text-white text-lg leading-relaxed">
                  Your taste is the asset. Scrubbing through clips is not. This
                  workshop puts the first one in charge and hands the second
                  one to a team that costs less than one month of an editor.
                </p>
              </div>
              <div className="relative border border-white/10 rounded-3xl p-8 bg-white/[0.03]">
                <ChromeStar size={40} rotate={20} className="absolute -top-5 -right-3 animate-twinkle" />
                <p className="text-xs tracking-widest text-white/50 mb-6">
                  IF YOU HAVE DONE ANY OF THESE THIS MONTH, KEEP READING
                </p>
                <ul className="space-y-4">
                  {pains.map((pain, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--deck-rose)] flex-shrink-0" />
                      <span className="text-white/85 leading-relaxed">{pain}</span>
                    </li>
                  ))}
                </ul>
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

        {/* How the work flows */}
        <section id="how-it-works" className="bg-[var(--background)] py-20 md:py-28 scroll-mt-24 relative overflow-hidden">
          <Stripes className="-bottom-24 -left-24 w-[380px] h-[380px] rounded-full hidden lg:block" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="font-serif text-4xl md:text-5xl">
                <span className="italic">how the work</span> FLOWS
              </h2>
              <p className="mt-4 text-[var(--gray-600)] max-w-2xl mx-auto text-lg">
                You drop a folder. Three jobs start at once. Nothing reaches you
                until it has been checked.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-6 items-center max-w-6xl mx-auto">
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 text-center">
                <PinkFolder size={64} className="mx-auto mb-3" />
                <p className="font-serif text-xl">Your folder</p>
                <p className="text-sm text-[var(--gray-600)] mt-1">Raw clips. Voice memos, one line each.</p>
              </div>
              <DoodleArrow size={64} className="hidden lg:block opacity-70" />
              <div className="space-y-3">
                {["Voice builds the voiceover", "Scout pulls candidate clips", "QA passes or fails each one"].map((t, i) => (
                  <div key={i} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-5 py-3 flex items-center gap-3">
                    <ChromeStar size={18} />
                    <span className="text-sm font-medium">{t}</span>
                  </div>
                ))}
                <p className="text-xs text-center text-[var(--gray-600)]">all three at the same time</p>
              </div>
              <DoodleArrow size={64} className="hidden lg:block opacity-70" />
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 text-center">
                <p className="font-serif text-xl">Cuts edits</p>
                <p className="text-sm text-[var(--gray-600)] mt-1">Storyboard, mockups, render, captions, stickers.</p>
                <div className="mt-3 flex justify-center gap-1.5">
                  {["v1", "v1b", "v1c"].map((v) => (
                    <span key={v} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-warm)] border border-[var(--border-warm)] text-[var(--gray-600)]">{v}</span>
                  ))}
                </div>
              </div>
              <DoodleArrow size={64} className="hidden lg:block opacity-70" />
              <div className="bg-[var(--cta-bg)] text-white rounded-2xl p-6 text-center">
                <p className="text-xs tracking-widest text-white/70 mb-1">COORDINATOR CHECKS, THEN</p>
                <p className="font-serif text-2xl">You approve</p>
                <p className="text-sm text-white/80 mt-1">Notes by clip number. Final say, always.</p>
              </div>
            </div>
          </div>
        </section>

        {/* The Team */}
        <section className="bg-[var(--gray-50)] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="font-serif text-4xl md:text-5xl">
                <span className="italic">meet the team</span> YOU WILL BUILD
              </h2>
              <p className="mt-4 text-[var(--gray-600)] max-w-2xl mx-auto text-lg">
                Four specialists with one job each, and one coordinator who
                is the only one you ever talk to. You give a note. The
                coordinator routes it to the right assistant, checks the fix,
                and brings it back.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="relative md:col-span-2 lg:col-span-3 bg-[var(--card-bg)] border-2 border-[var(--accent)] rounded-2xl p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-8 items-center shadow-[0_16px_40px_rgba(42,38,37,0.10)]">
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
                    You never need to brief Voice, Scout, QA, or Cuts
                    directly. You drop your folder and your notes with the coordinator. It
                    assigns the work, checks every result against your rules,
                    and hands you one finished version to review. When you say
                    &ldquo;Clip 3: brighter clip,&rdquo; the coordinator knows
                    that goes to Scout and QA, and you never think about it.
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
                  className="relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 hover:-translate-y-1 hover:shadow-xl transition-all"
                >
                  <span className="absolute -top-3 -left-2 w-9 h-9 rounded-full bg-[var(--cta-bg)] text-white font-serif flex items-center justify-center text-sm rotate-[-8deg] shadow">
                    {i + 1}
                  </span>
                  <h3 className="font-poppins font-bold tracking-[-0.02em] text-3xl text-[var(--accent)] leading-none mb-2">
                    {member.name}
                  </h3>
                  <p className="text-xs tracking-widest text-[var(--gray-600)] mb-4">
                    {member.role.toUpperCase()} · REPORTS TO THE COORDINATOR
                  </p>
                  <p className="text-[var(--gray-600)] leading-relaxed text-sm mb-5">
                    {member.description}
                  </p>
                  <p className="text-xs text-[var(--foreground)] bg-[var(--surface-warm)] border border-[var(--border-warm)] rounded-full px-3 py-1.5 inline-block">
                    <span className="text-[var(--gray-600)]">{member.blame}</span>{" "}
                    <strong>The coordinator sends it to {member.name}.</strong>
                  </p>
                </div>
              ))}
              <div className="relative lg:col-span-2 bg-[var(--cta-bg)] text-white rounded-2xl p-8 flex flex-col justify-between overflow-hidden">
                <ChromeStar size={90} rotate={15} className="absolute -top-6 -right-6 opacity-30" />
                <div>
                  <h3 className="font-poppins font-bold tracking-[-0.02em] text-3xl leading-none mb-2">You</h3>
                  <p className="text-xs tracking-widest text-white/70 mb-4">FINAL SAY</p>
                  <p className="text-white/90 leading-relaxed text-sm">
                    You talk to one assistant. You approve the storyboard, you
                    approve the mockups, and you give notes by clip number. The
                    coordinator does the delegating. You handle the taste.
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

        {/* Rules on notebook paper */}
        <section className="bg-[var(--background)] py-20 md:py-28 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <h2 className="font-serif text-4xl md:text-5xl mb-6">
                  <span className="italic">you get my</span> ACTUAL RULES.
                </h2>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-4">
                  &ldquo;Make it look good&rdquo; leaves a lot open to
                  interpretation. So I wrote my taste down in an almost
                  embarrassing amount of detail, and my team applies it on
                  every project.
                </p>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-6">
                  Some of it is vanity. Some of it is readability. Some of it is
                  making sure a video never implies something happened when it
                  did not.
                </p>
                <blockquote className="border-l-4 border-[var(--accent)] pl-5 font-serif text-2xl italic leading-snug mb-6">
                  AI does not get to invent my receipts.
                </blockquote>
                <p className="text-lg text-[var(--foreground)] leading-relaxed">
                  You leave with my full playbook as your starting point. Start
                  your own list with the notes you keep repeating. If you have
                  said it twice, it belongs in the instructions.
                </p>
              </div>
              <div className="relative">
                <ChromeStar size={48} rotate={-12} className="absolute -top-6 -left-4 z-10 animate-twinkle" />
                <div className="relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-2xl rotate-[1.5deg] overflow-hidden">
                  <div className="absolute inset-y-0 left-10 w-px bg-[var(--accent)] opacity-40" aria-hidden="true" />
                  <div className="absolute inset-y-0 left-12 w-px bg-[var(--accent)] opacity-40" aria-hidden="true" />
                  <div className="bg-[repeating-linear-gradient(transparent_0_31px,var(--card-border)_31px_32px)] pl-16 pr-8 pt-6 pb-8">
                    <p className="font-poppins font-bold tracking-[-0.02em] text-2xl text-[var(--accent)] leading-8 mb-2">
                      the playbook
                    </p>
                    <ul>
                      {rules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-3 leading-8 text-[var(--foreground)]">
                          <ChromeStar size={14} className="mt-[9px]" />
                          <span className="text-[15px]">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Sticker rotate={-6} className="absolute -bottom-5 left-6 z-10">
                  said it twice? it&apos;s a rule.
                </Sticker>
              </div>
            </div>
          </div>
        </section>

        {/* Review loop */}
        <section className="bg-[var(--surface-warm)] border-y border-[var(--border-warm)] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-last lg:order-first relative min-h-[320px]">
                <div className="absolute top-0 left-0 sm:left-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl rounded-bl-sm px-5 py-3 shadow-lg rotate-[-2deg] max-w-[260px]">
                  <p className="text-xs text-[var(--gray-600)] mb-1">you, 9:14 PM</p>
                  <p className="font-medium">Clip 3: brighter clip.</p>
                </div>
                <div className="absolute top-24 right-0 sm:right-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl rounded-bl-sm px-5 py-3 shadow-lg rotate-[2deg] max-w-[260px]">
                  <p className="text-xs text-[var(--gray-600)] mb-1">you, 9:15 PM</p>
                  <p className="font-medium">Clip 7: different angle.</p>
                </div>
                <div className="absolute top-48 left-4 sm:left-14 bg-[var(--cta-bg)] text-white rounded-2xl rounded-br-sm px-5 py-3 shadow-lg rotate-[-1deg] max-w-[280px]">
                  <p className="text-xs text-white/70 mb-1">coordinator, 9:31 PM</p>
                  <p className="font-medium">v1c is ready. Scout swapped cut 3, QA passed cut 7. Phone preview attached.</p>
                </div>
                <div className="absolute bottom-0 right-2 sm:right-10 flex gap-1.5">
                  {["v1", "v1b", "v1c"].map((v, i) => (
                    <span key={v} className={`text-xs px-3 py-1 rounded-full border ${i === 2 ? "bg-[var(--cta-bg)] text-white border-[var(--cta-bg)]" : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--gray-600)]"}`}>{v}</span>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="font-serif text-4xl md:text-5xl mb-6">
                  <span className="italic">a review loop</span> YOU CAN STAND.
                </h2>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-4">
                  Cuts starts with a numbered storyboard. You approve the plan
                  while it is still a plan. Every render gets a version name
                  and a vertical phone preview, because that is how people are
                  going to watch it.
                </p>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-6">
                  Then you give notes by clip number. A specific note gives the
                  team something specific to fix. When a correction reveals a
                  rule, it goes in the playbook.
                </p>
                <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5">
                  <p className="font-medium text-[var(--foreground)] mb-1">
                    What this means for you
                  </p>
                  <p className="text-sm text-[var(--gray-600)] leading-relaxed">
                    Every correction you give once becomes a rule the team
                    follows forever. By your third Reel, you are approving
                    edits, not making them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="bg-[var(--background)] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="font-serif text-4xl md:text-5xl">
                <span className="italic">the afternoon,</span> MINUTE BY MINUTE
              </h2>
              <p className="mt-4 text-[var(--gray-600)] max-w-2xl mx-auto text-lg">
                Saturday, October 24. All times Eastern. You follow along with
                your own footage and leave with your team running.
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
        <section id="register" className="relative bg-[var(--gray-50)] py-20 md:py-28 scroll-mt-24 overflow-hidden">
          <Stripes className="-top-20 -left-20 w-[360px] h-[360px] rounded-full hidden lg:block" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="font-serif text-4xl md:text-5xl">
                <span className="italic">save your</span> SEAT
              </h2>
              <p className="mt-4 text-[var(--gray-600)] max-w-2xl mx-auto text-lg">
                One session. One price. Everything below is included.
              </p>
            </div>
            <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto items-start">
              <div className="lg:col-span-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 md:p-10">
                <p className="text-xs tracking-widest text-[var(--gray-600)] mb-7">
                  WHAT YOU GET
                </p>
                <ul className="space-y-6">
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
                <div className="mt-8 pt-6 border-t border-[var(--card-border)] grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="font-serif text-lg mb-3">Yes, if</p>
                    <ul className="space-y-2">
                      {forYou.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--gray-600)]">
                          {CHECK}
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-serif text-lg mb-3">Skip it, if</p>
                    <ul className="space-y-2">
                      {notForYou.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--gray-600)]">
                          <svg className="w-5 h-5 text-[var(--gray-400)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
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
                  Less than most editors charge for a single Reel. No
                  subscription. Recording included.
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
                    Show up live. If you do not leave with your team set up and
                    your first rules written, email me within 48 hours and I
                    refund every cent.
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
        <section className="bg-[var(--background)] py-20 md:py-28 overflow-hidden">
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
                  while working as a software engineer, then as an AI engineer
                  and educator. My platform has earned me over $500,000 and
                  put me in rooms with Microsoft, Adobe, HP, and Anthropic.
                </p>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-4">
                  I also have disgustingly high standards for how I look on the
                  internet, which is how I ended up spending more time fixing
                  edits than filming. So I built a team to do it my way. This
                  workshop is that build, start to finish, with you doing it
                  alongside me.
                </p>
                <p className="text-lg text-[var(--foreground)] leading-relaxed">
                  I still review every video. I still make the creative
                  decisions. I just stopped doing the parts that did not need
                  me.
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
        <section className="bg-[var(--dark-section-bg)] py-20 md:py-28">
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

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import Image from "next/image";
import PageViewTracker from "./PageViewTracker";
import OfferButton from "./OfferButton";
import EventCountdown from "./EventCountdown";
import WorkshopCta from "./WorkshopCta";
import FAQAccordion from "./FAQAccordion";
import StickyBar from "./StickyBar";
import PhoneVideo from "./PhoneVideo";
import DemoVideo from "./DemoVideo";

const TITLE = "AI Video Editing Plugin & Live Workshop | The Black Female Engineer";
const DESCRIPTION =
  "Get Naya's AI editing plugin for $97, join the $147 live workshop with the plugin included, or access it through Disgustingly Paid for $99/month.";
const PAGE_URL = "https://www.theblackfemaleengineer.com/ai-video-editor-workshop";

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
      "Finding clips, picking takes, and moving captions by hand",
      "Every project starts from a blank timeline",
    ],
    highlight: false,
  },
  {
    name: "Hire an editor",
    cost: "An invoice per project",
    lines: [
      "You explain your taste on every project and still get chewing footage back",
      "Every change is another round trip",
    ],
    highlight: false,
  },
  {
    name: "Your AI editing team",
    cost: "$97, once",
    lines: [
      "Set it up once, then it runs on every project",
      "Your rules apply on every clip. You approve the storyboard, the mockup, and the render.",
      "Runs in Grok Bot. Platform costs are separate.",
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
  { time: "3:15", title: "Set up the five roles", detail: "Open the plugin together, then make the roles yours." },
  { time: "3:50", title: "Your folder, your rules", detail: "Voice memos line by line. Start your playbook from mine." },
  { time: "4:30", title: "Teach it your style", detail: "Reference Reel, then mockups before renders." },
  { time: "5:00", title: "Build the review loop", detail: "Versions, phone previews, notes by clip number." },
  { time: "5:30", title: "Live Q&A", detail: "Bring the edit you are stuck on. We wrap at 6:00." },
];

const workshopIncluded = [
  {
    title: "The plugin, included in the price",
    detail: "The Coordinator, Voice, Scout, QA, and Cuts, with my rules and review workflow. The link arrives by email right after payment, so you can start before the session.",
  },
  {
    title: "The live build, October 24 at 3:00 PM ET",
    detail: "Three hours with live Q&A. You leave with your team set up on your own footage.",
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

const offers = [
  {
    key: "plugin" as const,
    name: "AI Video Editing Plugin",
    price: "$97",
    cadence: "one time",
    description:
      "Get the editing team and configure it around your footage, references, and rules.",
    points: [
      "The Coordinator, Voice, Scout, QA, and Cuts, already written",
      "My editing rules and review workflow: storyboard, mockup, versions, notes by clip number",
      "Access link by email right after payment",
      "You import it into your own Grok Bot account and connect your footage yourself",
      "No live workshop or personal setup",
    ],
    note: "Runs in Grok Bot. Any required platform subscription or usage charges are separate.",
    emphasis: true,
  },
  {
    key: "membership" as const,
    name: "Disgustingly Paid Membership",
    price: "$99",
    cadence: "per month, billed monthly until you cancel",
    description:
      "Get the plugin as part of Disgustingly Paid, alongside the community's ongoing resources and activities.",
    points: [
      "The plugin, in your welcome email",
      "Ongoing community support",
      "My sound-effects folder",
      "New weekly builds, including the Content Strategist, Brand Deal Finder, and Meeting Notes to Content agents and email capture templates",
      "Updates to the agents as I make them",
      "Access by free Skool invite from me within 24 hours of payment",
    ],
    note: "Recurring $99/month through Stripe. Cancel any time by replying to one email.",
    emphasis: false,
  },
  {
    key: "workshop" as const,
    name: "Live Workshop + Plugin",
    price: "$147",
    cadence: "one time, plugin included",
    description:
      "Get the plugin, then join me live to set it up and adapt it to your content.",
    points: [
      "Everything in the plugin",
      "Saturday, October 24, 2026, 3:00 to 6:00 PM Eastern",
      "Live demonstration, guided customization, and Q&A",
      "Full recording in your inbox within 24 hours after",
      "Show-up guarantee: attend live, and if you leave without your team set up, email within 48 hours for a full refund",
    ],
    note: null,
    emphasis: false,
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

function CompareLink({ label = "Compare all three options", className = "" }: { label?: string; className?: string }) {
  return (
    <a
      href="#choose-your-option"
      className={`inline-flex items-center gap-2 text-[var(--foreground)] font-medium px-2 py-3 hover:text-[var(--accent)] transition-colors ${className}`}
    >
      {label}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </a>
  );
}

const SECTION = "py-16 md:py-28";
const CONTAINER = "max-w-6xl mx-auto px-5 sm:px-6 lg:px-8";
const CARD_BUTTON =
  "inline-flex w-full items-center justify-center gap-2 bg-[var(--cta-bg)] text-white px-6 py-3.5 rounded-full font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed";
const CARD_BUTTON_OUTLINE =
  "inline-flex w-full items-center justify-center gap-2 border border-[var(--accent)] text-[var(--accent)] px-6 py-3.5 rounded-full font-medium hover:bg-[var(--surface-warm)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed";

export default function AIVideoEditorWorkshopPage() {
  return (
    <>
      <PagePresenceTracker page="ai-video-editor-workshop" />
      <PageViewTracker />
      <Navigation />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Product",
              name: "AI Video Editing Plugin",
              description:
                "Naya's configured AI editing team for Grok Bot: Coordinator, Voice, Scout, QA, and Cuts, with her editing rules and review workflow. Self-service setup.",
              brand: { "@type": "Brand", name: "The Black Female Engineer" },
              offers: {
                "@type": "Offer",
                price: "97",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                url: `${PAGE_URL}#choose-your-option`,
              },
            },
            {
              "@type": "Event",
              name: "Build Your AI Video Editing Team: Live Workshop + Plugin",
              description:
                "Three-hour live workshop with Naya to set up and customize the AI Video Editing Plugin. Plugin included.",
              startDate: "2026-10-24T15:00:00-04:00",
              endDate: "2026-10-24T18:00:00-04:00",
              eventStatus: "https://schema.org/EventScheduled",
              eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
              location: { "@type": "VirtualLocation", url: PAGE_URL },
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
                url: `${PAGE_URL}#workshop`,
                validFrom: "2026-10-10",
                validThrough: "2026-10-24T15:00:00-04:00",
              },
            },
            {
              "@type": "Product",
              name: "Disgustingly Paid Membership",
              description:
                "Monthly membership to Naya's Skool community. Includes the AI Video Editing Plugin.",
              brand: { "@type": "Brand", name: "The Black Female Engineer" },
              offers: {
                "@type": "Offer",
                price: "99",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                url: `${PAGE_URL}#choose-your-option`,
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: "99",
                  priceCurrency: "USD",
                  billingDuration: "P1M",
                },
              },
            },
          ],
        }}
      />
      <StickyBar />
      <main className="bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
        {/* Hero: the walkthrough */}
        <section id="hero" className="pt-32 md:pt-44 pb-16 md:pb-24">
          <div className={CONTAINER}>
            <div className="max-w-3xl mx-auto text-center">
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
                A folder of clips in. A finished Reel out.
              </p>
            </div>

            <div className="max-w-3xl mx-auto text-center">
              <p className="mt-10 md:mt-14 text-lg md:text-xl text-[var(--gray-600)] leading-relaxed max-w-2xl mx-auto">
                Get my ready-to-use AI editing team for Grok Bot. Give it your
                footage, voiceovers, and editing rules, then review the video
                and ask for changes.
              </p>
              <p className="mt-4 text-base md:text-lg font-medium text-[var(--foreground)]">
                Plugin: $97 one time. Live workshop: $147 including the plugin.
              </p>
              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <OfferButton offer="plugin" location="hero" />
                <CompareLink />
              </div>
              <p className="mt-5 text-xs text-[var(--gray-600)]">
                Runs in Grok Bot. Any required platform subscription or usage
                charges are separate.
              </p>
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
                  One Reel used to cost me three to five hours.
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
                  <p className={`${LABEL} text-[var(--gray-600)]`}>A Reel, by hand</p>
                  <ul className="mt-4 space-y-3 text-sm md:text-[15px] text-[var(--gray-600)] leading-relaxed">
                    {[
                      "Scrub 100 clips looking for the good angle",
                      "Pick the best take of every line by ear",
                      "Lay captions, move captions, fix captions",
                      "Render, watch, notice the sticker over a word, render again",
                      "Hours later, post it unsure",
                    ].map((line) => (
                      <li key={line} className="flex gap-3">
                        <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[var(--gray-400)] flex-shrink-0" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-[var(--accent)] bg-[var(--card-bg)] p-6 md:p-7">
                  <p className={`${LABEL} text-[var(--accent)]`}>With your AI editing team</p>
                  <ul className="mt-4 space-y-3 text-sm md:text-[15px] text-[var(--foreground)] leading-relaxed">
                    {[
                      "Drop the folder and your notes with the coordinator",
                      "Approve a storyboard and a mockup",
                      "Get v1 with a phone preview",
                      "Send one note: “Clip 7: different angle.”",
                      "Approve v1b. Post it.",
                    ].map((line) => (
                      <li key={line} className="flex gap-3">
                        <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[var(--cta-bg)] flex-shrink-0" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <OfferButton offer="plugin" location="problem" wrapperClassName="w-full" className={CARD_BUTTON} />
                  </div>
                  <div className="mt-2 text-center">
                    <CompareLink label="Compare the options" className="text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Choose your option */}
        <section id="choose-your-option" className={`${SECTION} scroll-mt-24`}>
          <div className={CONTAINER}>
            <SectionHeading
              eyebrow="Three ways to get it"
              title="Choose how you want to get started."
              lede="Get the editor on its own, set it up with me live, or access it through Disgustingly Paid."
            />
            <div className="grid md:grid-cols-3 gap-4 md:gap-5 items-stretch">
              {offers.map((offer) => (
                <div
                  key={offer.key}
                  className={`rounded-2xl bg-[var(--card-bg)] p-6 md:p-7 flex flex-col ${
                    offer.emphasis
                      ? "border-2 border-[var(--accent)] md:shadow-[0_24px_60px_rgba(42,38,37,0.12)]"
                      : "border border-[var(--card-border)]"
                  }`}
                >
                  <h3 className="font-serif font-bold text-2xl leading-tight">{offer.name}</h3>
                  <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                    <span className="font-poppins font-bold tracking-[-0.02em] text-5xl leading-none text-[var(--foreground)]">
                      {offer.price}
                    </span>
                    <span className="text-sm text-[var(--gray-600)]">{offer.cadence}</span>
                  </div>
                  <p className="mt-4 text-[var(--gray-600)] leading-relaxed">{offer.description}</p>
                  <ul className="mt-5 pt-5 border-t border-[var(--card-border)] space-y-2.5 text-sm text-[var(--gray-600)] leading-relaxed">
                    {offer.points.map((point) => (
                      <li key={point} className="flex gap-3">
                        <span className={`mt-[9px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${offer.emphasis ? "bg-[var(--cta-bg)]" : "bg-[var(--gray-400)]"}`} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  {offer.key === "workshop" && (
                    <div className="mt-5">
                      <EventCountdown />
                    </div>
                  )}
                  <div className="mt-6 pt-2 mt-auto">
                    {offer.key === "workshop" ? (
                      <WorkshopCta>
                        <OfferButton offer="workshop" location="compare" wrapperClassName="w-full" className={CARD_BUTTON_OUTLINE} />
                      </WorkshopCta>
                    ) : (
                      <OfferButton
                        offer={offer.key}
                        location="compare"
                        wrapperClassName="w-full"
                        className={offer.emphasis ? CARD_BUTTON : CARD_BUTTON_OUTLINE}
                      />
                    )}
                    {offer.key === "workshop" && (
                      <a href="#workshop" className="mt-3 block text-center text-sm font-medium text-[var(--accent)] hover:underline underline-offset-4">
                        See the full agenda
                      </a>
                    )}
                    {offer.note && (
                      <p className="mt-3 text-xs text-[var(--gray-600)] leading-snug text-center">{offer.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-[var(--gray-600)]">
              The $147 workshop price includes the plugin. It is not $147 on
              top of $97.
            </p>
          </div>
        </section>

        {/* The cost of your standards */}
        <section className={`bg-[var(--dark-section-bg)] ${SECTION}`}>
          <div className={CONTAINER}>
            <SectionHeading
              dark
              eyebrow="The math"
              title={<>Your standards are expensive.</>}
              lede="My Reels took three to five hours each, three times a week. Three ways to get that time back."
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
              title="Meet the team inside the plugin."
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

                <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
                  <OfferButton offer="plugin" location="team" />
                  <CompareLink label="Compare the options" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workshop */}
        <section id="workshop" className={`bg-[var(--gray-50)] ${SECTION} scroll-mt-24`}>
          <div className={CONTAINER}>
            <SectionHeading
              eyebrow="Live Workshop + Plugin, $147"
              title="Set it up with me live on October 24."
              lede="Saturday, October 24, 2026, 3:00 to 6:00 PM Eastern. The plugin is included with your workshop ticket. Get access after purchase and bring your setup questions to the live session."
            />
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 md:p-10">
                  <p className={`${LABEL} text-[var(--gray-600)] mb-6`}>Three hours, minute by minute. All times Eastern.</p>
                  <ol className="divide-y divide-[var(--card-border)]">
                    {schedule.map((item, i) => (
                      <li key={i} className="grid grid-cols-[4rem_1fr] sm:grid-cols-[5rem_1fr] gap-4 py-4 first:pt-0 last:pb-0">
                        <span className="font-poppins font-bold tracking-[-0.02em] text-lg text-[var(--accent)] leading-none pt-1">{item.time}</span>
                        <div>
                          <p className="font-medium leading-snug">{item.title}</p>
                          <p className="mt-1 text-sm text-[var(--gray-600)] leading-relaxed">{item.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 md:p-10">
                  <p className={`${LABEL} text-[var(--gray-600)] mb-6`}>What the $147 includes</p>
                  <ul className="divide-y divide-[var(--card-border)]">
                    {workshopIncluded.map((item, i) => (
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
              </div>

              <div className="lg:col-span-5 rounded-2xl border border-[var(--accent)] bg-[var(--card-bg)] p-6 md:p-8 lg:sticky lg:top-32">
                <p className={`${LABEL} text-[var(--accent)]`}>Live on October 24</p>
                <h3 className="font-serif font-bold text-2xl leading-tight mt-2">
                  Build Your AI Video Editing Team
                </h3>
                <p className="mt-1.5 text-sm text-[var(--gray-600)]">
                  Saturday, October 24, 2026 · 3:00 to 6:00 PM ET
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-poppins font-bold tracking-[-0.02em] text-6xl leading-none text-[var(--foreground)]">$147</span>
                  <span className="text-sm text-[var(--gray-600)]">one time, plugin included</span>
                </div>
                <p className="mt-2 text-sm text-[var(--gray-600)]">
                  The same $97 plugin, plus three hours of live setup and
                  customization with me, Q&amp;A, and the full recording.
                </p>
                <div className="mt-6">
                  <WorkshopCta>
                    <OfferButton
                      offer="workshop"
                      location="card"
                      wrapperClassName="w-full"
                      className={CARD_BUTTON}
                    />
                  </WorkshopCta>
                </div>
                <div className="mt-4">
                  <EventCountdown />
                </div>
                <div className="mt-6 pt-6 border-t border-[var(--card-border)] flex items-start gap-3 text-sm text-[var(--gray-600)] leading-relaxed">
                  <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                  <p>
                    <span className="font-medium text-[var(--foreground)]">Show-up guarantee, workshop only.</span>{" "}
                    Attend live. If you leave without your team set up, email me
                    within 48 hours for a full refund.
                  </p>
                </div>
                <p className="mt-5 text-xs text-[var(--gray-600)]">
                  Secure checkout by Stripe. Your plugin link, receipt, and
                  calendar details arrive by email right after.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Guarantee */}
        <section className="bg-[var(--gray-50)] pb-16 md:pb-28">
          <div className={CONTAINER}>
            <div className="rounded-2xl bg-[var(--cta-bg)] text-white p-8 md:p-12 grid md:grid-cols-12 gap-6 md:gap-10 items-center">
              <div className="md:col-span-8">
                <p className={`${LABEL} text-white/70`}>The show-up guarantee, for the $147 workshop</p>
                <h2 className="font-serif font-bold text-2xl md:text-4xl leading-tight mt-2">
                  Leave with your team running, or get the $147 back.
                </h2>
                <p className="mt-4 text-white/80 leading-relaxed max-w-2xl">
                  Come to the live session. If you walk out without your five
                  assistants set up and working on your footage, email me within
                  48 hours and I refund the full amount. No form, no call. This
                  guarantee applies to the live workshop purchase.
                </p>
              </div>
              <div className="md:col-span-4 md:justify-self-end">
                <WorkshopCta dark>
                  <OfferButton offer="workshop" location="guarantee" wrapperClassName="w-full md:w-auto" className="inline-flex w-full items-center justify-center gap-2 bg-white text-[var(--cta-bg)] px-6 py-3.5 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-70" />
                </WorkshopCta>
              </div>
            </div>
          </div>
        </section>

        {/* Instructor */}
        <section className={SECTION}>
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
                <Label>Who built this</Label>
                <h2 className="font-serif font-bold text-3xl md:text-5xl leading-[1.1]">
                  Who is behind the plugin.
                </h2>
                <p className="mt-6 text-lg text-[var(--gray-600)] leading-relaxed">
                  I&apos;m Naya. I built a 200,000+ person audience on video
                  while working as a software engineer, then as an AI engineer.
                  My platform has earned me over $500,000 and put me in rooms
                  with Microsoft, Adobe, HP, and Anthropic.
                </p>
                <p className="mt-4 text-lg text-[var(--gray-600)] leading-relaxed">
                  I have disgustingly high standards for how I look online, so
                  I built a team that edits my way. The plugin is that team,
                  packaged. The workshop is me building it with you, start to
                  finish.
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
            <Label dark>Your next Reel</Label>
            <h2 className="font-serif font-bold text-4xl md:text-6xl leading-[1.08] text-white">
              Your next Reel, edited by a team that already knows your rules.
            </h2>
            <p className="mt-6 text-lg text-white/60 max-w-xl mx-auto">
              Get the plugin for $97 and set it up today. Or join me live on
              October 24 for $147 with the plugin included, or get it inside
              Disgustingly Paid for $99 a month.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <OfferButton offer="plugin" location="final" />
              <a
                href="#choose-your-option"
                className="inline-flex items-center gap-2 text-white font-medium px-2 py-3 hover:text-[var(--deck-rose)] transition-colors"
              >
                Compare all three options
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
              </a>
            </div>
            <p className="mt-6 text-sm text-white/60">
              Runs in Grok Bot. Any required platform subscription or usage
              charges are separate.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

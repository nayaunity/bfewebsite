// AI Income Lab — Monetizable Skill Quiz content.
// Copy carried over from the source spec, with em-dashes restructured per
// the site-wide copy rule (no em-dashes in user-facing copy).

export type ArchetypeKey =
  | "builder"
  | "maker"
  | "artist"
  | "translator"
  | "operator"
  | "guide";

export type Play = {
  label: string;
  text: string;
};

export type Archetype = {
  key: ArchetypeKey;
  name: string;
  identity: string;
  selling: string;
  plays: Play[];
  firstMove: string;
  watchOut: string;
};

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  builder: {
    key: "builder",
    name: "The Builder",
    identity: "You make things work. If it can be built, you'll figure out how.",
    selling:
      "Not code. Speed. You compress months of someone's problem into a working thing they can use on Monday.",
    plays: [
      {
        label: "GET CLIENTS",
        text: "Use ChatGPT or Perplexity to research what your competitors ship and where they're weak, then position your build around the gap they're ignoring.",
      },
      {
        label: "SCALE DELIVERY",
        text: "Run a coding agent (Claude Code, Cursor) as your dev team so you ship features and client projects in days instead of weeks.",
      },
      {
        label: "PRODUCTIZE",
        text: "Use Canva AI or Claude to design the logo and landing page for the thing you built, and turn your one custom build into a template other people buy.",
      },
    ],
    firstMove:
      "Pick the one thing you've already built or half-built and put a price and a landing page on it this week. Not a new project. The one that exists.",
    watchOut:
      "Building instead of selling. Your next build is not the bottleneck. Your offer is.",
  },
  maker: {
    key: "maker",
    name: "The Maker",
    identity: "You work with your hands and leave something real behind.",
    selling:
      "A transformation people can stand in. Nobody can outsource your hands. That's exactly why your expertise, written down, is worth more than your hours.",
    plays: [
      {
        label: "GET CLIENTS",
        text: "Use a coding agent to build a simple landing page with photos of your work, then wire Zapier plus ChatGPT to read incoming quote requests and suggest what to charge.",
      },
      {
        label: "SCALE DELIVERY",
        text: "Record a call with a client where you assess their space, use Wispr Flow to talk out exactly how you'd do the work, then have Claude turn that into a custom digital guide. You just became a consultant who gets paid without traveling.",
      },
      {
        label: "PRODUCTIZE",
        text: "After a few of those custom guides, have Claude merge them into one master guide anyone who lands on your page can buy on repeat.",
      },
    ],
    firstMove:
      "Photograph your last three finished jobs and write down what you'd charge to do each one again. That's your first offer page.",
    watchOut:
      "Trading only hours for money. Your knowledge scales even when your hands can't.",
  },
  artist: {
    key: "artist",
    name: "The Artist",
    identity: "You make things people want to look at, wear, and keep.",
    selling:
      "Taste. It's the least automatable thing you own. AI can produce infinite output, but it can't decide what's good.",
    plays: [
      {
        label: "GET CLIENTS",
        text: "Use AI to write the story behind each piece so your work sells while you sleep, and build a simple landing page for commissions with clear tiers and prices.",
      },
      {
        label: "SCALE DELIVERY",
        text: "Pair ChatGPT's image tools with Canva to turn your original work into digital products: prints, greeting cards, postcards, graphic tees, printed and shipped on demand.",
      },
      {
        label: "PRODUCTIZE",
        text: "Turn your style into a system: templates, packs, or presets people buy to get a piece of your eye without hiring you.",
      },
    ],
    firstMove:
      "Take one existing piece and turn it into one buyable product this week. One piece, one product, one price.",
    watchOut:
      "Undercharging because it felt fun to make. Ease is not a discount.",
  },
  translator: {
    key: "translator",
    name: "The Translator",
    identity: "You take the complicated thing and make it obvious.",
    selling: "Time. People pay to skip the confusion you already walked through.",
    plays: [
      {
        label: "GET CLIENTS",
        text: "Use AI to mine the exact questions your people ask (comments, Reddit, reviews) and make content that answers them so specifically it feels illegal.",
      },
      {
        label: "SCALE DELIVERY",
        text: "Talk your knowledge out loud with Wispr Flow, have Claude structure it into a guide, workshop, or curriculum, and stop staring at blank documents.",
      },
      {
        label: "PRODUCTIZE",
        text: "Build a custom GPT trained on your method so people get your thinking on demand, and package the rest as a paid guide or mini-course.",
      },
    ],
    firstMove:
      "Write the one-page explainer only you could write, and give it away in exchange for an email address.",
    watchOut:
      "Teaching for free forever. Free builds trust; paid builds freedom. You need both.",
  },
  operator: {
    key: "operator",
    name: "The Operator",
    identity: "You bring order to chaos. Plans, systems, logistics, numbers.",
    selling:
      "Calm. Founders and busy people pay a lot to stop holding everything in their head.",
    plays: [
      {
        label: "GET CLIENTS",
        text: "Use AI to audit a prospect's public presence or process and send a short “here are the three leaks I found” message. This closes clients faster than any pitch.",
      },
      {
        label: "SCALE DELIVERY",
        text: "Build your service on Zapier plus ChatGPT so intake, tracking, and reporting run themselves and you only do the judgment work.",
      },
      {
        label: "PRODUCTIZE",
        text: "Turn the system you keep rebuilding for clients into a Notion template, dashboard, or SOP pack you sell once and again and again.",
      },
    ],
    firstMove:
      "Document the system you've already built for yourself. That doc is the product.",
    watchOut:
      "Optimizing your own setup instead of selling it. Ship the messy version.",
  },
  guide: {
    key: "guide",
    name: "The Guide",
    identity: "People change after they talk to you.",
    selling:
      "Belief plus a plan. That's the most expensive thing on the market and the hardest to fake.",
    plays: [
      {
        label: "GET CLIENTS",
        text: "Use AI to turn your real client stories into content that names the exact problem your person is living in, so booking a call feels like the obvious next step.",
      },
      {
        label: "SCALE DELIVERY",
        text: "Use a meeting notetaker on every session, then have Claude produce the recap, action plan, and homework so clients feel held without doubling your hours.",
      },
      {
        label: "PRODUCTIZE",
        text: "Turn your repeated advice into a program, workbook, or custom GPT so the people who can't afford you one-on-one can still pay you.",
      },
    ],
    firstMove:
      "Offer your process to three people at a real price this week. Not free. Real.",
    watchOut:
      "Over-giving in sessions and under-charging in general. Structure is a kindness.",
  },
};

// Deterministic tiebreak order
export const TIEBREAK: ArchetypeKey[] = [
  "builder",
  "maker",
  "artist",
  "translator",
  "operator",
  "guide",
];

export type Option = {
  text: string;
  scores: Partial<Record<ArchetypeKey, number>>;
};

export type Question = {
  q: string;
  options: Option[];
};

export const QUESTIONS: Question[] = [
  {
    q: "Pick the compliment you've gotten most in your life.",
    options: [
      { text: "“How did you even build that?”", scores: { builder: 3 } },
      { text: "“Wait, you made this yourself?”", scores: { maker: 3 } },
      {
        text: "“This is beautiful. Where can I get one?”",
        scores: { artist: 3 },
      },
      {
        text: "“You explained that better than my professor.”",
        scores: { translator: 3 },
      },
    ],
  },
  {
    q: "It's a free Saturday, no obligations. What are you actually doing?",
    options: [
      {
        text: "Poking at a side project or a tool idea",
        scores: { builder: 3, operator: 1 },
      },
      {
        text: "Fixing, building, or improving something in your physical space",
        scores: { maker: 3 },
      },
      {
        text: "Making something visual just because you felt like it",
        scores: { artist: 3 },
      },
      {
        text: "Deep in a conversation helping a friend figure their life out",
        scores: { guide: 3 },
      },
    ],
  },
  {
    q: "Your friends text you when...",
    options: [
      {
        text: "Something is broken and needs to be fixed",
        scores: { maker: 2, builder: 2 },
      },
      {
        text: "They need their event, move, or trip organized",
        scores: { operator: 3 },
      },
      { text: "They need something to look good", scores: { artist: 3 } },
      {
        text: "They're spiraling and need a plan",
        scores: { guide: 2, translator: 1 },
      },
    ],
  },
  {
    q: "Which mess bothers you the most?",
    options: [
      {
        text: "A slow, manual process that should be automated",
        scores: { builder: 3 },
      },
      { text: "Something built badly or falling apart", scores: { maker: 3 } },
      {
        text: "Ugly design, bad layout, clashing everything",
        scores: { artist: 3 },
      },
      {
        text: "A disorganized calendar, budget, or plan",
        scores: { operator: 3 },
      },
    ],
  },
  {
    q: "You have to teach a room of 50 people something for an hour. What's the topic?",
    options: [
      {
        text: "How to build the thing I built",
        scores: { builder: 2, translator: 2 },
      },
      {
        text: "How to do the physical work properly, hands-on",
        scores: { maker: 2, translator: 2 },
      },
      {
        text: "How to develop your eye and your style",
        scores: { artist: 2, translator: 2 },
      },
      {
        text: "How to get your life or business in order",
        scores: { operator: 2, guide: 2 },
      },
    ],
  },
  {
    q: "Which of these has someone already offered to pay you for, even casually?",
    options: [
      {
        text: "Building or setting something up technical",
        scores: { builder: 4 },
      },
      {
        text: "Physical work: repair, renovation, install, styling a space, food, hair, fitness",
        scores: { maker: 4 },
      },
      {
        text: "Something you designed, drew, wrote, filmed, or made",
        scores: { artist: 4 },
      },
      {
        text: "Your advice, coaching, or time to think through their problem",
        scores: { guide: 4 },
      },
    ],
  },
  {
    q: "What do you lose track of time doing?",
    options: [
      {
        text: "Building, debugging, tinkering until it works",
        scores: { builder: 3 },
      },
      {
        text: "Working with materials, tools, or my hands",
        scores: { maker: 3 },
      },
      { text: "Designing, drawing, editing, styling", scores: { artist: 3 } },
      {
        text: "Researching, organizing, planning, optimizing",
        scores: { operator: 3 },
      },
    ],
  },
  {
    q: "Someone hands you a blank page and says “make me something valuable.” You...",
    options: [
      { text: "Build a tool that saves them hours", scores: { builder: 3 } },
      {
        text: "Build or fix a physical thing they'll use daily",
        scores: { maker: 3 },
      },
      {
        text: "Create something original they'll want to show off",
        scores: { artist: 3 },
      },
      {
        text: "Write them the exact step-by-step they've been missing",
        scores: { translator: 3 },
      },
    ],
  },
  {
    q: "Which sentence sounds most like you?",
    options: [
      {
        text: "“I can figure out how to build almost anything.”",
        scores: { builder: 3 },
      },
      {
        text: "“Give me the tools and I'll handle it.”",
        scores: { maker: 3 },
      },
      {
        text: "“I have a very specific taste and I trust it.”",
        scores: { artist: 3 },
      },
      {
        text: "“Give me a mess and I'll give you a system.”",
        scores: { operator: 3 },
      },
    ],
  },
  {
    q: "What's the part of work you'd happily never do again?",
    options: [
      {
        text: "Client small talk and hand-holding",
        scores: { builder: 2, maker: 2 },
      },
      {
        text: "Detailed admin, invoicing, tracking",
        scores: { artist: 2, guide: 1 },
      },
      {
        text: "Repetitive execution once the plan is clear",
        scores: { operator: 2, translator: 1 },
      },
      {
        text: "Being the one who has to make it look good",
        scores: { builder: 1, guide: 2 },
      },
    ],
  },
  {
    q: "When you learn something new, what do you immediately want to do?",
    options: [
      { text: "Build something with it", scores: { builder: 3 } },
      {
        text: "Try it with my hands and see how it feels",
        scores: { maker: 3 },
      },
      { text: "Make my own version of it", scores: { artist: 3 } },
      { text: "Teach it to someone else", scores: { translator: 3 } },
    ],
  },
  {
    q: "Be honest: what's actually stopping you from being paid for your skill?",
    options: [
      {
        text: "I keep building and never launching",
        scores: { builder: 2, artist: 1 },
      },
      {
        text: "I don't know how to price or find clients",
        scores: { maker: 2, operator: 1 },
      },
      {
        text: "I don't think what I do is “valuable” enough",
        scores: { artist: 2, guide: 1 },
      },
      {
        text: "I'm good at too many things and can't pick one",
        scores: { operator: 2, translator: 2 },
      },
    ],
  },
];

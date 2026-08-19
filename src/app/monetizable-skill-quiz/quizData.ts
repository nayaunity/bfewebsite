// AI Income Lab — "What's Your PHASE Path?" skill diagnostic.
// Content from the PHASE Path spec (two scored axes plus an entry check),
// with em-dashes restructured per the site-wide copy rule.

export type FamilyKey = "s" | "w" | "v" | "p" | "t" | "k";
export type Visibility = "visible" | "invisible";
export type Repeatability = "bespoke" | "repeatable";
export type ModeKey =
  | "invisible-repeatable"
  | "invisible-bespoke"
  | "visible-repeatable"
  | "visible-bespoke";
export type Evidence = "three-plus" | "one-two" | "none";
export type EntryPhase = "phase2" | "phase3";

export type Family = {
  key: FamilyKey;
  letter: string;
  label: string; // e.g. "Systems & Numbers"
  name: string; // e.g. "The Operator"
  oneLine: string;
  undersell: string;
  builds: Record<ModeKey, string>;
  gathers: string;
  priceBand: string;
  trap: string;
};

export const FAMILIES: Record<FamilyKey, Family> = {
  s: {
    key: "s",
    letter: "S",
    label: "Systems & Numbers",
    name: "The Operator",
    oneLine: "You make chaos legible.",
    undersell:
      "You don't just do the admin, you can see the shape of the mess. That's the part people pay for.",
    builds: {
      "invisible-repeatable":
        "A GPT trained on your categorisation rules, plus a template pack she runs monthly",
      "invisible-bespoke":
        "A one-off clean-up and rebuild of her records, delivered as a working file",
      "visible-repeatable":
        "A 90-minute “get your numbers straight” workshop, run monthly",
      "visible-bespoke":
        "A diagnostic call plus a rebuilt system, priced as one engagement",
    },
    gathers:
      "Seller and freelancer communities at the point of tax deadlines; small-practice owners; anyone posting a screenshot of a spreadsheet asking for help.",
    priceBand: "£120–£400 to start. Raise after three.",
    trap: "Taking on the whole finance function. Sell the one recurring mess, not “operations”.",
  },
  w: {
    key: "w",
    letter: "W",
    label: "Words",
    name: "The Translator",
    oneLine: "You make people sound like the competent version of themselves.",
    undersell:
      "Rewriting isn't a favour you do quickly, it's a set of rules you apply consistently. Those rules are the product.",
    builds: {
      "invisible-repeatable":
        "A GPT trained on your rules and five before/afters, plus one review pass",
      "invisible-bespoke":
        "A full rewrite delivered in a week, one round of revisions",
      "visible-repeatable":
        "A live rewrite session where six people bring one document each",
      "visible-bespoke": "A 60-minute extraction call, then you write it",
    },
    gathers:
      "Career-change groups; people posting “I've applied 40 times and heard nothing”; founders drafting their own sales pages badly.",
    priceBand: "£150–£500 to start.",
    trap: "Competing with free AI on output. You're not selling the words, you're selling knowing which words are wrong.",
  },
  v: {
    key: "v",
    letter: "V",
    label: "Visual & Craft",
    name: "The Maker",
    oneLine: "You make things people trust on sight.",
    undersell:
      "Taste is a rule set too. You can name why the ugly version fails, and that naming is teachable.",
    builds: {
      "invisible-repeatable":
        "A template pack plus a GPT that writes the copy to drop into it",
      "invisible-bespoke":
        "One asset rebuilt properly: deck, brand kit, or launch set",
      "visible-repeatable":
        "A “make yours not look homemade” workshop with live fixes",
      "visible-bespoke":
        "Art direction: a call, a critique, and a rebuilt master file",
    },
    gathers:
      "Anyone about to pitch, launch or apply; course creators with good content and bad slides; local businesses with strong word of mouth and a weak site.",
    priceBand: "£200–£600 to start.",
    trap: "Endless revisions. Sell one round, name it in the offer line.",
  },
  p: {
    key: "p",
    letter: "P",
    label: "People & Process",
    name: "The Guide",
    oneLine: "You get humans through something difficult.",
    undersell:
      "You already know the emotional order of the journey: what people panic about first, second, third. Almost nobody documents that, and it's the whole product.",
    builds: {
      "invisible-repeatable":
        "A structured self-guided path plus a GPT that answers the 20 predictable questions in your voice",
      "invisible-bespoke":
        "A written plan built from one intake form, delivered in 48 hours",
      "visible-repeatable":
        "A four-week small group, same six milestones every time",
      "visible-bespoke":
        "One-to-one guidance through a specific transition, fixed number of sessions",
    },
    gathers:
      "Wherever people describe a transition in the present tense: “I'm three weeks in and drowning”.",
    priceBand: "£250–£900 to start.",
    trap: "Unlimited access. Cap the container or you'll resent it by week three.",
  },
  t: {
    key: "t",
    letter: "T",
    label: "Technical & Automation",
    name: "The Builder",
    oneLine: "You make things work without a person in the loop.",
    undersell:
      "The buyer doesn't want automation, she wants the task gone. Sell the disappearance, not the stack.",
    builds: {
      "invisible-repeatable":
        "One automation productised: same setup, same price, deployed per client",
      "invisible-bespoke":
        "A custom build with a Loom walkthrough and a handover doc",
      "visible-repeatable":
        "A build-along where everyone leaves with the same working system",
      "visible-bespoke": "An audit call, then you build what you found",
    },
    gathers:
      "People posting about copying data between two tools; agencies drowning in onboarding admin; anyone whose “system” is a group chat.",
    priceBand: "£300–£1,200 to start.",
    trap: "Naming the tools in your offer. She doesn't care that it's Zapier. She cares that Monday mornings stop.",
  },
  k: {
    key: "k",
    letter: "K",
    label: "Insider Knowledge",
    name: "The Insider",
    oneLine: "You've survived a world other people are trying to enter.",
    undersell:
      "Everything. You think it's “just your job” because everyone around you knows it too. Step one metre outside that building and it's the scarcest thing in the room.",
    builds: {
      "invisible-repeatable":
        "The real map, what actually gets you through, plus a GPT trained on how insiders phrase things",
      "invisible-bespoke":
        "A review of her attempt by someone who's been on the other side of the table",
      "visible-repeatable":
        "A monthly “ask someone who's actually done it” session",
      "visible-bespoke":
        "One call where you tell her the truth about her chances and what to change",
    },
    gathers:
      "The forums for people trying to get into your field; the subreddit where they ask questions your colleagues would find obvious.",
    priceBand:
      "£150–£800 to start. Insider access carries a premium; don't price it like information.",
    trap: "Assuming it's common knowledge. Test the assumption before you discount yourself.",
  },
};

export type Mode = {
  key: ModeKey;
  label: string;
  sells: string;
  priceShape: string;
  gptRule: string;
};

export const MODES: Record<ModeKey, Mode> = {
  "invisible-repeatable": {
    key: "invisible-repeatable",
    label: "Invisible + Repeatable",
    sells: "A GPT, template or system she uses herself",
    priceShape: "Low price, high volume",
    gptRule:
      "In your mode, the GPT is the product. A version of your judgement gets trained into it. Nobody sells hours here.",
  },
  "invisible-bespoke": {
    key: "invisible-bespoke",
    label: "Invisible + Bespoke",
    sells: "A done-for-you build, delivered async",
    priceShape: "Mid price, few clients",
    gptRule:
      "Whatever your build is, a version of your judgement gets trained into a GPT. It's how you deliver in a third of the time. Nobody sells hours here.",
  },
  "visible-repeatable": {
    key: "visible-repeatable",
    label: "Visible + Repeatable",
    sells: "A short cohort, workshop or group program",
    priceShape: "Mid price, batched",
    gptRule:
      "Whatever your build is, a version of your judgement gets trained into a GPT. It's how you deliver in a third of the time. Nobody sells hours here.",
  },
  "visible-bespoke": {
    key: "visible-bespoke",
    label: "Visible + Bespoke",
    sells: "Consulting, coaching, or a diagnostic call plus fix",
    priceShape: "High price, low volume",
    gptRule:
      "Whatever your build is, a version of your judgement gets trained into a GPT. It's how you deliver in a third of the time. Nobody sells hours here.",
  },
};

// Part A — each option scores one family letter.
export type FamilyQuestion = {
  q: string;
  options: { text: string; family: FamilyKey }[];
};

export const FAMILY_QUESTIONS: FamilyQuestion[] = [
  {
    q: "When something at work or at home is a mess, what do you instinctively do first?",
    options: [
      { text: "Build a spreadsheet or a tracker for it", family: "s" },
      { text: "Write it out so it finally makes sense", family: "w" },
      {
        text: "Redesign how it looks so people actually use it",
        family: "v",
      },
      { text: "Get the right people on a call and sort it out", family: "p" },
      { text: "Automate it so nobody has to touch it again", family: "t" },
      {
        text: "Explain what's actually going on, because you've seen this before",
        family: "k",
      },
    ],
  },
  {
    q: "What do people come to you for, unprompted?",
    options: [
      { text: "“Can you check my numbers?”", family: "s" },
      { text: "“Can you read this before I send it?”", family: "w" },
      { text: "“Can you make this look better?”", family: "v" },
      { text: "“Can you talk to them for me?”", family: "p" },
      { text: "“Can you make this thing work?”", family: "t" },
      {
        text: "“You've done this. How does it actually work?”",
        family: "k",
      },
    ],
  },
  {
    q: "Which of these have you done more than five times?",
    options: [
      {
        text: "Cleaned up someone else's data, budget or process",
        family: "s",
      },
      { text: "Rewritten someone's CV, bio, email or post", family: "w" },
      {
        text: "Made a deck, a template, a video or a brand look right",
        family: "v",
      },
      {
        text: "Managed a group of people, clients or patients through something",
        family: "p",
      },
      { text: "Set up a tool, integration, site or script", family: "t" },
      {
        text: "Guided someone through a system you know from the inside",
        family: "k",
      },
    ],
  },
  {
    q: "What kind of praise do you get that you brush off?",
    options: [
      { text: "“You're so organised, it's unreal”", family: "s" },
      { text: "“You just say it better than I can”", family: "w" },
      { text: "“You have such a good eye”", family: "v" },
      {
        text: "“Everyone always calms down when you're there”",
        family: "p",
      },
      {
        text: "“You're the only one who could figure that out”",
        family: "t",
      },
      { text: "“You know this industry inside out”", family: "k" },
    ],
  },
  {
    q: "Pick the task you'd genuinely rather do on a Sunday.",
    options: [
      { text: "Reconcile a messy set of records", family: "s" },
      { text: "Cut a rambling 800 words down to 200", family: "w" },
      { text: "Rebuild an ugly slide deck", family: "v" },
      { text: "Run a workshop for eight people", family: "p" },
      {
        text: "Wire two apps together so a report sends itself",
        family: "t",
      },
      {
        text: "Answer 20 questions from people new to your field",
        family: "k",
      },
    ],
  },
  {
    q: "What have you already been paid for, even once, even badly?",
    options: [
      {
        text: "Anything involving numbers, admin or operations",
        family: "s",
      },
      { text: "Anything involving words", family: "w" },
      { text: "Anything visual", family: "v" },
      {
        text: "Anything involving managing or caring for people",
        family: "p",
      },
      { text: "Anything technical", family: "t" },
      {
        text: "Your job title itself: the expertise, not the tasks",
        family: "k",
      },
    ],
  },
];

// Part B — two axes, three questions each. Majority answer wins the axis.
export type VisibilityQuestion = {
  q: string;
  options: { text: string; value: Visibility }[];
};

export const VISIBILITY_QUESTIONS: VisibilityQuestion[] = [
  {
    q: "A client asks for a live call to walk through your work. Honest reaction?",
    options: [
      { text: "Fine, that's the part I like", value: "visible" },
      {
        text: "I'd rather send it and answer questions in writing",
        value: "invisible",
      },
    ],
  },
  {
    q: "Which sounds more like a good week?",
    options: [
      { text: "Four calls where I actually helped someone", value: "visible" },
      { text: "Four days uninterrupted, one thing shipped", value: "invisible" },
    ],
  },
  {
    q: "Selling requires you to post about yourself. Where do you land?",
    options: [
      { text: "I'll do it, it's a muscle", value: "visible" },
      { text: "I'd rather the work spoke for itself", value: "invisible" },
    ],
  },
];

export type RepeatabilityQuestion = {
  q: string;
  options: { text: string; value: Repeatability }[];
};

export const REPEATABILITY_QUESTIONS: RepeatabilityQuestion[] = [
  {
    q: "Would you rather solve one hard problem for one person, or the same problem for fifty?",
    options: [
      { text: "One hard problem, properly", value: "bespoke" },
      {
        text: "Same problem, fifty times, refined each round",
        value: "repeatable",
      },
    ],
  },
  {
    q: "How much do the details vary in your work?",
    options: [
      { text: "Every case is genuinely different", value: "bespoke" },
      {
        text: "Honestly, it's the same five things every time",
        value: "repeatable",
      },
    ],
  },
  {
    q: "Which annoys you more?",
    options: [
      {
        text: "Doing something repetitive I've already solved",
        value: "repeatable",
      },
      { text: "Being boxed into one narrow deliverable", value: "bespoke" },
    ],
  },
];

// Part C — entry point.
export const ENTRY_QUESTIONS = [
  {
    q: "Can you name five real people who'd recognise themselves in your buyer description right now?",
    options: [
      { text: "Yes, I could list them", value: "phase3" as EntryPhase },
      { text: "No", value: "phase2" as EntryPhase },
    ],
  },
  {
    q: "Do you have examples of this work you could show, even unpaid?",
    options: [
      { text: "Yes, three or more", value: "three-plus" as Evidence },
      { text: "One or two", value: "one-two" as Evidence },
      { text: "None", value: "none" as Evidence },
    ],
  },
];

export const EVIDENCE_HOMEWORK: Record<Evidence, string> = {
  "three-plus":
    "You have three or more examples. Your Phase 4 build starts with those as GPT training examples.",
  "one-two":
    "You have one or two examples. Use them, and Phase 5's first two clients become the rest.",
  none: "No examples yet. Phase 4 starts with one free build in exchange for permission to use it.",
};

export const EVIDENCE_PROMPT_LINE: Record<Evidence, string> = {
  "three-plus": "three or more people (I have examples I can show)",
  "one-two": "one or two people (I have a couple of examples)",
  none: "nobody paid yet",
};

export const ENTRY_COPY: Record<EntryPhase, string> = {
  phase3:
    "You can already name five real buyers. Skip straight to Phase 3: run the prompt below to sharpen the list, then go sell to them.",
  phase2:
    "Start at Phase 2. Your first job is finding the buyers, and the prompt below does exactly that.",
};

// Tie-break order for family scoring (K is checked separately; the spec says
// Insider Knowledge nearly always beats whichever other letter you scored).
export const FAMILY_ORDER: FamilyKey[] = ["s", "w", "v", "p", "t", "k"];

// Named combinations from the spec, shown when two letters tie even after
// the Q6 tie-break.
export const COMBO_NOTES: Partial<Record<string, string>> = {
  "s+w": "S+W is documentation.",
  "v+k": "V+K is explaining your industry visually.",
  "p+t": "P+T is automated client onboarding.",
};

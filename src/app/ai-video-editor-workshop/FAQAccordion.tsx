"use client";

const GROK_URL =
  "https://x.ai/bot?utm_source=naya-bere&utm_medium=creator&utm_campaign=evergreen_oct2026&utm_content=instagram_post1";

const faqs: { question: string; answer: React.ReactNode }[] = [
  {
    question: "What is the plugin, exactly?",
    answer:
      "A configured AI editing workflow for Grok Bot: the Coordinator plus Voice, Scout, QA, and Cuts, with my editing rules and review steps already written. It is not a standalone video editing app. It runs inside your own Grok Bot account.",
  },
  {
    question: "Do I need the live workshop?",
    answer:
      "No. Buy the plugin on its own and set it up yourself. The workshop adds three hours of live setup with me, Q&A, and the full recording.",
  },
  {
    question: "Does the $147 workshop include the plugin?",
    answer:
      "Yes. $147 is the total. There is no separate $97 charge.",
  },
  {
    question: "Is the plugin included in Disgustingly Paid?",
    answer:
      "Yes. The plugin link arrives in your membership welcome email, alongside your Skool invite and the community's other resources.",
  },
  {
    question: "Which option should I choose?",
    answer: (
      <ul className="space-y-2">
        <li>
          <strong className="text-white">Plugin, $97.</strong> You want the team and you are
          fine setting it up on your own.
        </li>
        <li>
          <strong className="text-white">Workshop + plugin, $147.</strong> You want to set it
          up live with me and ask questions as you go.
        </li>
        <li>
          <strong className="text-white">Disgustingly Paid, $99/month.</strong> You want the
          plugin plus the community, the sound-effects folder, and the new builds I add each
          week.
        </li>
      </ul>
    ),
  },
  {
    question: "What do I need, and what does it cost to run?",
    answer: (
      <>
        A Grok account. The plugin runs in Grok Bot. Any xAI subscription or usage charges are
        billed by xAI and are separate from this purchase.{" "}
        <a
          href={GROK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--deck-rose)] underline underline-offset-4 hover:opacity-80"
        >
          Set up Grok Bot here
        </a>
        .
      </>
    ),
  },
  {
    question: "When do I get access?",
    answer:
      "Right after payment, by email from naya@theblackfemaleengineer.com. Check spam if you do not see it within a few minutes. Workshop buyers get the plugin link in the same email as their seat confirmation and calendar link; the join link for the live session follows before October 24. Members get the plugin link in their welcome email, and the Skool invite comes within 24 hours.",
  },
  {
    question: "I'm not technical. Can I actually use this?",
    answer:
      "Yes. No code. The roles and rules are written in plain English and you change them by typing. The workshop walks through every step live if you would rather not do it alone.",
  },
  {
    question: "Will it match my style, or will it look like AI?",
    answer:
      "You hand it one reference Reel and it studies the fonts, caption placement, and pacing frame by frame. Cuts shows you a mockup before it renders anything, so you catch a wrong look before it costs you a render.",
  },
  {
    question: "My footage is a mess. Does that matter?",
    answer:
      "Bring what you have. Scout searches your project folder and your footage library, and QA rejects any clip that breaks your rules before it reaches the edit. You stop sorting clips by hand.",
  },
  {
    question: "Does the AI edit everything for me? I don't want to lose control.",
    answer:
      "It edits exactly what you tell it to: the whole video, one section, just the voiceover, or just the B-roll. You approve the storyboard, the mockups, and the final render. You make the creative decisions.",
  },
  {
    question: "What if I can't make the workshop live on October 24?",
    answer:
      "Your plugin arrives right after purchase either way. The full recording lands in your inbox within 24 hours after the workshop ends, and you keep it.",
  },
  {
    question: "What time is 3:00 PM Eastern where I am?",
    answer:
      "12 PM Pacific, 1 PM Mountain, 2 PM Central, 8 PM UK, 9 PM Central Europe. Your confirmation email has a calendar link.",
  },
  {
    question: "Can I keep using the plugin if I cancel Disgustingly Paid?",
    answer:
      "The plugin lives in your own Grok Bot account. Cancelling ends your access to the community, the sound-effects folder, and the new builds and updates that come through it.",
  },
  {
    question: "What's the refund and cancellation policy?",
    answer: (
      <ul className="space-y-2">
        <li>
          <strong className="text-white">$147 workshop:</strong> the show-up guarantee. Attend
          live, and if you leave without your team set up, email
          theblackfemaleengineer@gmail.com within 48 hours for a full refund.
        </li>
        <li>
          <strong className="text-white">Disgustingly Paid:</strong> cancel any time by replying
          to one email.
        </li>
      </ul>
    ),
  },
];

export default function FAQAccordion() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {faqs.map((faq, i) => (
        <details
          key={i}
          className="group border border-white/10 rounded-2xl overflow-hidden"
        >
          <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-left text-white font-medium text-lg hover:bg-white/5 transition-colors list-none [&::-webkit-details-marker]:hidden">
            {faq.question}
            <svg
              className="w-5 h-5 text-[var(--deck-rose)] flex-shrink-0 ml-4 transition-transform group-open:rotate-45"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </summary>
          <div className="px-6 pt-2 pb-6 text-white/70 leading-relaxed">
            {faq.answer}
          </div>
        </details>
      ))}
    </div>
  );
}

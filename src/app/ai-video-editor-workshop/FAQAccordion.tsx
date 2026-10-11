"use client";

const faqs = [
  {
    question: "I'm not technical. Can I actually build this?",
    answer:
      "Yes. There is no code in this workshop. You are writing job descriptions, hand-offs, and rules in plain English, then handing them to an AI assistant. If you can describe what a bad angle looks like, you can build this team. I walk through every step live and you build alongside me.",
  },
  {
    question: "What do I need to have ready?",
    answer:
      "An AI assistant that supports custom instructions and reusable skills. I build my team with Claude, and that is what we use live. Bring a folder with 10 to 20 raw clips and a few voice memos from a recent Reel so you have real footage to work with. A footage library like Air is optional.",
  },
  {
    question: "What if I can't make it live on October 24?",
    answer:
      "Register anyway. Every registrant gets the full recording plus the templates within 24 hours of the session, and you keep them. You will miss the live Q&A, but you can still build the whole team from the replay.",
  },
  {
    question: "Does the AI edit everything for me? I don't want to lose control.",
    answer:
      "It edits exactly what you tell it to. That can be the whole video, one section, just the voiceover, or just the B-roll. You set the scope on every project, you approve the storyboard, the mockups, and the final render, and you give notes by clip number. The team handles the repetitive work. You make the creative decisions.",
  },
  {
    question: "What time is 3:00 PM Eastern where I am?",
    answer:
      "12:00 PM Pacific, 1:00 PM Mountain, 2:00 PM Central, 8:00 PM in the UK, and 9:00 PM in Central Europe. Your confirmation email includes a calendar link that adjusts to your timezone.",
  },
  {
    question: "Will this work for YouTube or TikTok, or just Instagram Reels?",
    answer:
      "The roles, hand-offs, and rules are platform agnostic. I use my team for Reels, but the same system edits any short vertical video. The caption placement rules are the only part that changes by platform, and you set those yourself.",
  },
  {
    question: "What's the refund policy?",
    answer:
      "Show up live. If you do not leave with your team set up and your first rules written, email theblackfemaleengineer@gmail.com within 48 hours of the workshop and you get a full refund. No forms, no interrogation.",
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

"use client";

const faqs = [
  {
    question: "I'm not technical. Can I actually build this?",
    answer:
      "Yes. No code. You write job descriptions and rules in plain English and hand them to an AI assistant. I walk through every step live.",
  },
  {
    question: "What do I need to have ready?",
    answer:
      "An AI assistant with custom instructions and skills. I build mine with Claude, so that is what we use. Bring 10 to 20 raw clips and a few voice memos from a recent Reel.",
  },
  {
    question: "What if I can't make it live on October 24?",
    answer:
      "Register anyway. The full recording and templates land in your inbox within 24 hours, and you keep them.",
  },
  {
    question: "Does the AI edit everything for me? I don't want to lose control.",
    answer:
      "It edits exactly what you tell it to: the whole video, one section, just the voiceover, or just the B-roll. You approve the storyboard, the mockups, and the final render. You make the creative decisions.",
  },
  {
    question: "What time is 3:00 PM Eastern where I am?",
    answer:
      "12 PM Pacific, 1 PM Mountain, 2 PM Central, 8 PM UK, 9 PM Central Europe. Your confirmation email has a calendar link.",
  },
  {
    question: "What's the refund policy?",
    answer:
      "Show up live. If you leave without your team set up, email theblackfemaleengineer@gmail.com within 48 hours for a full refund.",
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

"use client";

const faqs = [
  {
    question: "I'm an engineer, not a creator. Will this work for me?",
    answer:
      "That's exactly who this course is built for. The whole premise is that your technical credibility is your differentiator. You don't need to become a full-time creator. You need a system that turns what you already know into posts that attract the right people.",
  },
  {
    question: "What if I have zero audience right now?",
    answer:
      "Starting from zero is assumed. Every module works at any follower count. The course walks you through what to post in your first 30 days when you have no data, how to read early signals, and how to keep going when growth feels slow.",
  },
  {
    question: "When does the course start?",
    answer:
      "The course launches on May 15, 2026. By reserving your seat now you lock in the presale price and get access as soon as it opens. Group coaching office hours for the $999 tier begin the week of the launch. 1:1 coaching sessions for the $1999 tier are scheduled after onboarding.",
  },
  {
    question: "How long does the course take to finish?",
    answer:
      "The self-guided modules are designed for roughly 6 to 8 weeks if you do one module per week. Everything is self-paced with lifetime access, so if life gets in the way you can come back to it.",
  },
  {
    question: "Can I upgrade tiers later?",
    answer:
      "Yes. If you enroll in a lower tier and want to add group coaching or 1:1 sessions later, you pay the difference. No re-enrollment, no hassle.",
  },
  {
    question: "What platforms does this cover?",
    answer:
      "Instagram (Reels, Carousels, Stories, Bio), LinkedIn, YouTube, TikTok, and X. The course teaches you how to pick the right platform for your niche rather than trying to be everywhere. Instagram gets the deepest treatment because the mechanics there are the most misunderstood.",
  },
  {
    question: "Is this about getting sponsorships and brand deals?",
    answer:
      "Brand deals are one monetization path. The course covers four: brand deals, building your own product, consulting, and speaking. Most technical creators make the most money on the non-sponsorship paths, which is why we spend time on all four.",
  },
  {
    question: "What's the refund policy?",
    answer:
      "14-day money-back guarantee on the self-guided tier. Full refund, no questions asked. For the $999 and $1999 tiers, refunds are pro-rated based on sessions and office hours used.",
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
              className="w-5 h-5 text-[#ffe500] flex-shrink-0 ml-4 transition-transform group-open:rotate-45"
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

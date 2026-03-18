"use client";

const faqs = [
  {
    question: "Do I need coding experience?",
    answer:
      "Yes, basic coding knowledge is expected (variables, functions, HTML/CSS). This is not a learn-to-code course. It's designed for career switchers who have foundational skills and want to level up with AI-powered development.",
  },
  {
    question: "Is this self-paced?",
    answer:
      "Yes, fully self-paced with lifetime access. Work through the modules on your own schedule. All content is available immediately after enrollment.",
  },
  {
    question: "What will my portfolio project look like?",
    answer:
      "You'll build and deploy 3 real AI-powered projects from scratch. These are things you can demo in interviews and link on your resume to show employers what you can do.",
  },
  {
    question: "What if I'm not satisfied?",
    answer:
      "We offer a 14-day money-back guarantee, no questions asked. If the course isn't for you, just reach out and we'll refund you in full.",
  },
  {
    question: "When does the course start?",
    answer:
      "Immediately after enrollment. All content is available on day one. No waiting for a cohort to begin.",
  },
  {
    question: "Will there be more seats after the founding class fills?",
    answer:
      "Yes, but the next round will be at the regular price of $499. The presale is the only time you'll see $399, and it's limited to 30 seats.",
  },
  {
    question: "Do I need a paid Claude subscription?",
    answer:
      "Module 1 walks you through everything you need to set up, including Claude Code access. We'll cover exactly what you need and how to get started.",
  },
  {
    question: "What will I have at the end of the course?",
    answer:
      "Three deployed, portfolio-ready projects you built from scratch. You'll also have hands-on experience with the Anthropic API and developer-grade prompting skills.",
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
          <div className="px-6 pb-5 text-white/70 leading-relaxed">
            {faq.answer}
          </div>
        </details>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS = [
  {
    question: "What is theBFE?",
    answer:
      "theBFE is a platform that automatically applies to jobs at top tech companies on your behalf. We match you to roles based on your skills, experience, and preferences, then handle the entire application process.",
  },
  {
    question: "How does BFE apply for me?",
    answer:
      "After you fill out your profile and upload your resume, our system scans job listings across 30+ top companies. When we find a match, we fill out and submit the application directly on the company website, tailoring each one to the role.",
  },
  {
    question: "Is this free?",
    answer:
      "Yes! Our free plan includes 5 applications per month with smart resume matching. For more volume, our Starter and Pro plans offer 100 and 300 applications per month respectively.",
    link: { href: "/pricing", label: "See pricing" },
  },
  {
    question: "What companies do you work with?",
    answer:
      "We apply to roles at Stripe, Airbnb, Figma, Anthropic, Salesforce, Pinterest, Notion, and more. Our list is always growing.",
  },
  {
    question: "How long until I get interviews?",
    answer:
      "Most users start seeing responses within 1-2 weeks. BFE users average 2-5x more interviews compared to traditional job searching.",
  },
  {
    question: "Do I need a resume?",
    answer:
      "Yes, you'll upload your resume during profile setup. Our smart matching system ensures the right resume version goes to each application.",
  },
  {
    question: "Can I control which jobs I'm applied to?",
    answer:
      "Absolutely. You set your job preferences including roles, locations, salary range, and experience level. You have full control over what jobs BFE applies to on your behalf.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-4xl md:text-5xl text-center mb-12">
          FAQ
        </h2>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={i < FAQS.length - 1 ? "border-b border-[var(--card-border)]" : ""}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[var(--gray-50)] transition-colors"
                >
                  <span className="font-medium text-[var(--foreground)] pr-4">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 text-[var(--gray-600)] transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
                <div
                  className={`grid transition-all duration-200 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 text-sm text-[var(--gray-600)] leading-relaxed">
                      {faq.answer}
                      {faq.link && (
                        <>
                          {" "}
                          <Link
                            href={faq.link.href}
                            className="text-[#ef562a] underline hover:no-underline"
                          >
                            {faq.link.label}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

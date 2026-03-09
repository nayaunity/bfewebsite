"use client";

import { useState, useEffect, useRef } from "react";

const seatsRemaining = 3;
const totalSeats = 5;

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-[#ef562a] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
    </svg>
  );
}

function CTAButton() {
  return (
    <a
      href="YOUR_STRIPE_LINK"
      className="inline-flex items-center gap-2 bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors text-lg"
    >
      Claim Your VIP Seat
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
      </svg>
    </a>
  );
}

export default function PresaleContent() {
  const targetDate = useRef<number>(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [timeLeft, setTimeLeft] = useState({ days: 7, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = targetDate.current - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const faqs = [
    {
      question: "When does it start?",
      answer: "We begin within 2 weeks of your enrollment. You\u2019ll receive a welcome email with a scheduling link to book your first coaching call at a time that works for you.",
    },
    {
      question: "What do the content audits include?",
      answer: "Each month, I\u2019ll review your content across platforms (LinkedIn, Twitter/X, Instagram, TikTok\u2014wherever you\u2019re building). You\u2019ll get a personalized audit doc with what\u2019s working, what to change, content ideas for the next month, and growth tactics specific to your niche.",
    },
    {
      question: "What\u2019s the refund policy?",
      answer: "Because this is a high-touch, limited-seat program, all sales are final once your first coaching session is scheduled. If you have questions before purchasing, DM me on Instagram @theblackfemaleengineer and I\u2019m happy to chat.",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm tracking-widest text-[#ef562a] mb-4">VIP FOUNDING MEMBER</p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
              Build in Public:
              <br />
              <span className="italic text-[#ef562a]">Grow a Tech Audience</span>
              <br />
              from 0
            </h1>
            <p className="mt-6 text-xl text-[var(--gray-600)]">
              By Naya, founder of @theblackfemaleengineer. A VIP coaching program for tech professionals who want to build a personal brand, grow an engaged audience, and turn their expertise into influence.
            </p>
            <div className="mt-8">
              <CTAButton />
            </div>
          </div>
        </div>
      </section>

      {/* Urgency Bar */}
      <section className="bg-[#1a1a1a] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Countdown */}
            <div className="text-center">
              <p className="text-white/60 text-sm tracking-wide mb-3">OFFER ENDS IN</p>
              {expired ? (
                <p className="font-serif text-2xl text-[#ffe500]">Offer expired</p>
              ) : (
                <div className="flex justify-center gap-3">
                  {[
                    { value: timeLeft.days, label: "Days" },
                    { value: timeLeft.hours, label: "Hrs" },
                    { value: timeLeft.minutes, label: "Min" },
                    { value: timeLeft.seconds, label: "Sec" },
                  ].map((unit) => (
                    <div key={unit.label} className="bg-white/10 rounded-lg px-3 py-2 min-w-[56px]">
                      <div className="font-serif text-2xl md:text-3xl text-[#ffe500]">
                        {String(unit.value).padStart(2, "0")}
                      </div>
                      <div className="text-white/40 text-xs">{unit.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seats */}
            <div className="text-center">
              <p className="text-white/60 text-sm tracking-wide mb-3">LIMITED AVAILABILITY</p>
              <p className="font-serif text-2xl md:text-3xl text-[#ffe500]">
                {seatsRemaining} of {totalSeats}
              </p>
              <p className="text-white/60 text-sm">VIP seats remaining</p>
            </div>

            {/* Price */}
            <div className="text-center">
              <p className="text-white/60 text-sm tracking-wide mb-3">FOUNDING MEMBER PRICE</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-white/40 line-through text-xl">$2,999</span>
                <span className="font-serif text-3xl md:text-4xl text-[#ffe500]">$2,499</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl">
              <span className="italic">what you</span> GET
            </h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8">
              <ul className="space-y-5">
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <div>
                    <span className="font-medium">4 x 1-hour private coaching calls</span>
                    <p className="text-[var(--gray-600)] text-sm mt-1">
                      One-on-one strategy sessions tailored to your goals, niche, and stage of growth. We cover content strategy, platform selection, monetization, and more.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <div>
                    <span className="font-medium">Monthly content audits for 6 months</span>
                    <p className="text-[var(--gray-600)] text-sm mt-1">
                      Ongoing feedback on your content with actionable recommendations, growth tactics, and personalized ideas to keep your momentum going long after coaching ends.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="bg-[var(--gray-50)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
              <span className="italic">who this is</span> FOR
            </h2>
            <ul className="space-y-4">
              {[
                "Tech professionals who want to build a personal brand but don\u2019t know where to start",
                "Engineers, designers, and PMs who have expertise to share but struggle with consistency",
                "Career changers who want to stand out and attract opportunities through content",
                "Anyone in tech who\u2019s ready to go from lurker to thought leader",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-[var(--gray-600)]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
              <span className="italic">frequently asked</span> QUESTIONS
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl group"
                >
                  <summary className="px-6 py-5 cursor-pointer font-medium flex items-center justify-between list-none">
                    {faq.question}
                    <svg
                      className="w-5 h-5 text-[var(--gray-600)] group-open:rotate-180 transition-transform flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-5 text-[var(--gray-600)]">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#1a1a1a] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4 text-white">
            Ready to build your audience?
          </h2>
          <p className="text-white/60 mb-2 text-lg">
            Only {seatsRemaining} of {totalSeats} VIP founding member seats left.
          </p>
          <p className="text-white/40 mb-8">
            <span className="line-through">$2,999</span>{" "}
            <span className="text-[#ffe500] font-serif text-2xl">$2,499</span>
          </p>
          <CTAButton />
        </div>
      </section>
    </>
  );
}

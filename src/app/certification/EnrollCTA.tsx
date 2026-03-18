"use client";

// TODO: Replace with real payment link (Stripe Payment Link, Gumroad, etc.) before launch
const ENROLL_URL = "#enroll";

export default function EnrollCTA({ className }: { className?: string }) {
  return (
    <a
      href={ENROLL_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        fetch("/api/links/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            linkId: "course-enroll-cta",
            linkTitle: "Enroll - BFE Claude Code Course Presale",
            linkUrl: ENROLL_URL,
          }),
        }).catch(() => {});
      }}
      className={
        className ??
        "inline-flex items-center gap-2 bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors text-lg"
      }
    >
      Enroll Now <span className="line-through opacity-60">$499</span> $399
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
        />
      </svg>
    </a>
  );
}

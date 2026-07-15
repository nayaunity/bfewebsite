"use client";

export default function DownloadButton() {
  return (
    <a
      href="/downloads/60k-month-blueprint-breakdown.pdf"
      download="The-60K-Month-Blueprint-Breakdown.pdf"
      className="inline-flex items-center gap-3 bg-[#4d1b27] text-white px-8 py-4 rounded-full font-medium hover:bg-[#4d383b] transition-colors"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Download Free Blueprint
    </a>
  );
}

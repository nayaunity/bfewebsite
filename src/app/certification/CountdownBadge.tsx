"use client";

const TOTAL_SEATS = 50;
const SEATS_REMAINING = 50; // Update manually as enrollments come in

export default function CountdownBadge() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-block w-2 h-2 rounded-full bg-[#ef562a] animate-pulse" />
      <span className="text-[var(--gray-600)]">
        <strong className="text-[var(--foreground)]">
          {SEATS_REMAINING}
        </strong>{" "}
        of {TOTAL_SEATS} founding seats remaining
      </span>
    </div>
  );
}

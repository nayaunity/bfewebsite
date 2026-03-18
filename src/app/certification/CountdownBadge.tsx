"use client";

export default function CountdownBadge() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-block w-2 h-2 rounded-full bg-[#ef562a] animate-pulse" />
      <span className="text-[var(--gray-600)]">
        Only <strong className="text-[var(--foreground)]">30</strong> presale seats available
      </span>
    </div>
  );
}

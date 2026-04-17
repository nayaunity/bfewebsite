"use client";

import type { MatchedJob } from "@/lib/auto-apply/job-matcher";

interface Props {
  jobs: MatchedJob[];
  onApply: () => void;
}

export default function MatchedJobsPreview({ jobs, onApply }: Props) {
  if (jobs.length === 0) {
    return (
      <section className="text-center">
        <h1 className="font-serif text-3xl sm:text-4xl">
          We&apos;re still expanding our catalog for your role.
        </h1>
        <p className="mt-3 text-[var(--gray-600)]">
          Sign up and we&apos;ll email you as soon as we match fresh roles — usually within a few hours.
        </p>
        <button
          type="button"
          onClick={onApply}
          className="mt-8 rounded-full bg-[#ef562a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#d84a21]"
        >
          Create account to stay posted
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1 className="font-serif text-3xl sm:text-4xl">
        We found <span className="italic text-[#ef562a]">{jobs.length} jobs</span> for you.
      </h1>
      <p className="mt-3 text-[var(--gray-600)]">
        Start your 7-day free trial. We apply to all of these for you — no manual work.
      </p>

      <ul className="mt-8 space-y-3">
        {jobs.map((job) => (
          <li
            key={job.id}
            className="flex flex-col gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{job.title}</p>
              <p className="text-sm text-[var(--gray-600)]">
                {job.company} · {job.location || (job.remote ? "Remote" : "")}
              </p>
              {job.matchReason && (
                <p className="mt-1 text-xs text-[var(--gray-600)]">{job.matchReason}</p>
              )}
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-[var(--gray-50)] px-3 py-1 text-xs font-medium text-[var(--gray-800)]">
              Match
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onApply}
          className="rounded-full bg-[#ef562a] px-8 py-3 text-base font-semibold text-white hover:bg-[#d84a21]"
        >
          Start 7-day free trial to apply
        </button>
        <p className="text-xs text-[var(--gray-600)]">$0 today · Cancel anytime before day 8</p>
      </div>
    </section>
  );
}

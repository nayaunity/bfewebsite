import Image from "next/image";
import Link from "next/link";

interface ApplicationsEmptyStateProps {
  totalActiveJobs?: number;
  profileReady: boolean;
  missingRoles: boolean;
  missingResume: boolean;
  hasActiveSession: boolean;
  atLimit: boolean;
  starting: boolean;
  startResult: { success?: boolean; message?: string; error?: string } | null;
  onStartApplying: () => void;
}

function ExpectationCard({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ef562a]">
        {eyebrow}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--gray-600)]">{detail}</p>
    </div>
  );
}

export function ApplicationsEmptyState({
  totalActiveJobs,
  profileReady,
  missingRoles,
  missingResume,
  hasActiveSession,
  atLimit,
  starting,
  startResult,
  onStartApplying,
}: ApplicationsEmptyStateProps) {
  const activeJobsLabel =
    totalActiveJobs && totalActiveJobs > 0
      ? `${totalActiveJobs.toLocaleString()} active roles`
      : "thousands of active roles";

  return (
    <div className="px-6 py-10 md:px-8 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-[#ef562a]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ef562a]">
            Empty for now, not for long
          </span>
          <h3 className="mt-4 font-serif text-2xl text-[var(--foreground)] md:text-3xl">
            Your first matches will start landing here automatically
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--gray-600)]">
            Once your setup is ready, we scan {activeJobsLabel} every morning at 3am MT,
            match them to your resume and role preferences, then log each result here so
            you can see what was found, applied to, or skipped.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <ExpectationCard
              eyebrow="Daily scan"
              title="Fresh roles every morning"
              detail="New openings are checked on a daily cadence so you are not relying on stale job lists."
            />
            <ExpectationCard
              eyebrow="Live feed"
              title="Statuses update as work happens"
              detail="You will see jobs move from matched to applying to applied as each session runs."
            />
            <ExpectationCard
              eyebrow="Clear next step"
              title="Open the original posting fast"
              detail="Each row links back to the job posting so you can review the role or follow up directly."
            />
          </div>

          <div className="mt-6 rounded-3xl border border-[var(--card-border)] bg-[var(--gray-50)] p-5">
            {profileReady ? (
              <>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {hasActiveSession
                    ? "Your first auto-apply run is already in motion."
                    : atLimit
                      ? "You have reached your current application limit."
                      : "You are set up. Kick off your first run whenever you are ready."}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--gray-600)]">
                  {hasActiveSession
                    ? "This table will start filling in as matching jobs are discovered and processed."
                    : atLimit
                      ? "Upgrade your plan to keep the dashboard filling with new applications."
                      : "You can wait for the next 3am MT run or start one immediately to seed the dashboard now."}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {!hasActiveSession && !atLimit && (
                    <button
                      onClick={onStartApplying}
                      disabled={starting}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#ef562a] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#d44a22] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {starting ? "Finding matching jobs..." : "Start first apply session"}
                    </button>
                  )}
                  {(hasActiveSession || atLimit) && (
                    <Link
                      href={atLimit ? "/pricing" : "#today-auto-apply"}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-white"
                    >
                      {atLimit ? "See plan options" : "View today's activity"}
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Finish setup to unlock the first applications in this feed.
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--gray-600)]">
                  {missingRoles && (
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ef562a]" />
                      <Link href="/profile" className="hover:text-[#ef562a] hover:underline">
                        Set your target roles
                      </Link>
                    </li>
                  )}
                  {missingResume && (
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ef562a]" />
                      <Link href="/auto-apply/next-steps" className="hover:text-[#ef562a] hover:underline">
                        Upload a resume
                      </Link>
                    </li>
                  )}
                </ul>
              </>
            )}

            {startResult?.success && (
              <p className="mt-3 text-sm text-green-600">{startResult.message}</p>
            )}
            {startResult?.error && (
              <p className="mt-3 text-sm text-red-500">{startResult.error}</p>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-6 rounded-[2rem] bg-[#ef562a]/15 blur-3xl" />
          <div className="relative rounded-[2rem] border border-[var(--card-border)] bg-white/90 p-3 shadow-[0_28px_80px_rgba(239,86,42,0.14)]">
            <Image
              src="/images/dashboard-empty-state-preview.svg"
              alt="Illustrated preview of an applications dashboard with upcoming matches, live status pills, and example job rows."
              width={560}
              height={420}
              className="h-auto w-full rounded-[1.5rem]"
              priority
            />
          </div>
          <p className="mt-3 text-center text-xs text-[var(--gray-600)]">
            Preview of the activity feed users will start seeing after their first auto-apply run.
          </p>
        </div>
      </div>
    </div>
  );
}

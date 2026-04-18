import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { OnboardingTabs } from "./OnboardingTabs";

export const dynamic = "force-dynamic";

const STEP_LABELS: Record<number, string> = {
  0: "Opened wizard",
  1: "Job priorities",
  2: "Tried other apps?",
  3: "Value prop",
  4: "Timeline",
  5: "Interview goal",
  6: "Affirmation",
  7: "Target roles",
  8: "Experience level",
  9: "Locations",
  10: "Salary",
  11: "Value prop 2",
  12: "Goal",
  13: "Blocker",
  14: "Timeline chart",
  15: "Contact info",
  16: "Location/state",
  17: "Work authorization",
  18: "Creating plan",
  19: "Feature: matching",
  20: "Feature: auto-fill",
  21: "Feature: autopilot",
  22: "Feature: handled",
  23: "Plan summary",
  24: "Start applying",
};

async function getOnboardingData() {
  const [users, totalUsers, stepActivities] = await Promise.all([
    prisma.user.findMany({
      where: { onboardingCompletedAt: { not: null } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        onboardingData: true,
        onboardingCompletedAt: true,
        createdAt: true,
        subscriptionTier: true,
        targetRole: true,
        yearsOfExperience: true,
        workLocations: true,
        city: true,
        usState: true,
        remotePreference: true,
        _count: { select: { resumes: true } },
      },
      orderBy: { onboardingCompletedAt: "desc" },
    }),
    prisma.user.count(),
    prisma.activity.findMany({
      where: { type: "onboarding_step" },
      select: { metadata: true },
    }),
  ]);

  // Build step funnel counts
  const stepCounts: Record<number, number> = {};
  for (const a of stepActivities) {
    try {
      const meta = JSON.parse(a.metadata || "{}");
      const step = meta.step as number;
      if (typeof step === "number") {
        stepCounts[step] = (stepCounts[step] || 0) + 1;
      }
    } catch {}
  }

  return { users, totalUsers, stepCounts };
}

function parseStringArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string" && v.trim() !== "") : [];
  } catch {
    return [];
  }
}

type ProfileFallback = {
  targetRole: string | null;
  yearsOfExperience: string | null;
  workLocations: string | null;
  city: string | null;
  usState: string | null;
  remotePreference: string | null;
};

// For users who came through the resume-first /start flow, onboardingData is
// empty but the equivalent answers live in top-level User columns. This derives
// the same role/experience/location shape the old wizard wrote into
// onboardingData so the admin pills render consistently.
function deriveTags(data: Record<string, unknown>, user: ProfileFallback) {
  const roles = Array.isArray(data.roles) && data.roles.length > 0
    ? (data.roles as unknown[]).filter((r): r is string => typeof r === "string")
    : parseStringArray(user.targetRole);

  const experience = Array.isArray(data.experience) && data.experience.length > 0
    ? (data.experience as unknown[]).filter((e): e is string => typeof e === "string")
    : user.yearsOfExperience ? [`${user.yearsOfExperience} yrs`] : [];

  let locations: string[];
  if (Array.isArray(data.locations) && data.locations.length > 0) {
    locations = (data.locations as unknown[]).filter((l): l is string => typeof l === "string");
  } else {
    const fromWorkLocations = parseStringArray(user.workLocations);
    if (fromWorkLocations.length > 0) {
      locations = fromWorkLocations;
    } else {
      locations = [
        user.remotePreference,
        user.city && user.usState ? `${user.city}, ${user.usState}` : user.usState,
      ].filter((v): v is string => typeof v === "string" && v.trim() !== "");
    }
  }
  locations = Array.from(new Set(locations));

  return { roles, experience, locations };
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    timeZone: "America/Denver",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function OnboardingPage() {
  await requireAdmin();
  const { users, totalUsers, stepCounts } = await getOnboardingData();
  const hasStepData = Object.keys(stepCounts).length > 0;
  const maxStepCount = Math.max(...Object.values(stepCounts), 1);

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)]">
          Onboarding Data
        </h1>
        <p className="mt-2 text-[var(--gray-600)]">
          {users.length} of {totalUsers} users completed onboarding
        </p>
      </div>

      <OnboardingTabs
        funnelTab={
          <>
            {/* Step Funnel */}
            {hasStepData ? (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 mb-8">
                <h2 className="font-serif text-xl text-[var(--foreground)] mb-4">Step-by-Step Funnel</h2>
                <p className="text-xs text-[var(--gray-600)] mb-4">Where users drop off in the 25-step onboarding wizard. Steps with {">"}20% drop-off are highlighted in red.</p>
                <div className="space-y-1.5">
                  {Array.from({ length: 25 }, (_, i) => {
                    const count = stepCounts[i] || 0;
                    const pct = maxStepCount > 0 ? (count / maxStepCount) * 100 : 0;
                    const dropOff = i > 0 && stepCounts[i - 1] ? (((stepCounts[i - 1] - count) / stepCounts[i - 1]) * 100).toFixed(0) : null;
                    const isHighDrop = dropOff !== null && parseInt(dropOff) > 20;
                    return (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className="w-5 text-right text-[var(--gray-600)] font-mono">{i}</span>
                        <span className="w-36 truncate text-[var(--gray-600)]">{STEP_LABELS[i] || `Step ${i}`}</span>
                        <div className="flex-1 h-5 bg-[var(--gray-100)] rounded overflow-hidden">
                          <div
                            className={`h-full rounded ${isHighDrop ? "bg-red-400" : "bg-[#ef562a]"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-medium text-[var(--foreground)]">{count}</span>
                        {dropOff !== null && parseInt(dropOff) > 0 ? (
                          <span className={`w-12 text-right text-[10px] ${isHighDrop ? "text-red-500 font-bold" : "text-[var(--gray-600)]"}`}>
                            -{dropOff}%
                          </span>
                        ) : <span className="w-12" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 mb-8 text-center text-[var(--gray-600)]">
                No step data yet. The funnel will populate as new users go through onboarding.
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
                <p className="text-sm text-[var(--gray-600)]">Completed</p>
                <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{users.length}</p>
              </div>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
                <p className="text-sm text-[var(--gray-600)]">Conversion</p>
                <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
                  {totalUsers > 0 ? ((users.length / totalUsers) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
                <p className="text-sm text-[var(--gray-600)]">Top Blocker</p>
                <p className="text-lg font-bold text-[var(--foreground)] mt-1">
                  {(() => {
                    const blockers: Record<string, number> = {};
                    users.forEach((u) => {
                      try {
                        const d = JSON.parse(u.onboardingData || "{}");
                        if (d.blocker) blockers[d.blocker] = (blockers[d.blocker] || 0) + 1;
                      } catch {}
                    });
                    const top = Object.entries(blockers).sort((a, b) => b[1] - a[1])[0];
                    return top ? top[0] : "—";
                  })()}
                </p>
              </div>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
                <p className="text-sm text-[var(--gray-600)]">Avg Salary Target</p>
                <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
                  ${(() => {
                    const salaries = users.map((u) => {
                      try { return JSON.parse(u.onboardingData || "{}").minSalary || 0; } catch { return 0; }
                    }).filter((s) => s > 0);
                    return salaries.length > 0 ? (salaries.reduce((a, b) => a + b, 0) / salaries.length / 1000).toFixed(0) : "0";
                  })()}K
                </p>
              </div>
            </div>
          </>
        }
        usersTab={
          <>
            {/* User list */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="divide-y divide-[var(--card-border)]">
          {users.map((user) => {
            let data: Record<string, unknown> = {};
            try { data = JSON.parse(user.onboardingData || "{}"); } catch {}
            const tags = deriveTags(data, user);

            return (
              <div key={user.id} className="px-4 py-5 sm:px-6">
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </p>
                    {user.firstName && (
                      <p className="text-xs text-[var(--gray-600)]">{user.email}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--gray-600)]">
                      {formatDate(user.onboardingCompletedAt!)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--gray-100)] text-[var(--gray-600)]">
                        {user.subscriptionTier || "free"}
                      </span>
                      <span className="text-xs text-[var(--gray-600)]">
                        {user._count.resumes} resume{user._count.resumes !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Onboarding data tags */}
                <div className="flex flex-wrap gap-2">
                  {tags.roles.map((role: string) => (
                    <span key={role} className="text-xs px-2.5 py-1 rounded-full bg-[#ef562a]/10 text-[#ef562a] font-medium">
                      {role}
                    </span>
                  ))}
                  {tags.experience.map((exp: string) => (
                    <span key={exp} className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {exp}
                    </span>
                  ))}
                  {tags.locations.map((loc: string) => (
                    <span key={loc} className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {loc}
                    </span>
                  ))}
                  {data.minSalary ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#ffe500]/20 text-[#b8a600] dark:text-[#ffe500]">
                      ${(Number(data.minSalary) / 1000).toFixed(0)}K+
                    </span>
                  ) : null}
                  {data.timeline ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      {String(data.timeline)}
                    </span>
                  ) : null}
                  {data.goal ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--gray-100)] text-[var(--gray-600)]">
                      {String(data.goal)}
                    </span>
                  ) : null}
                  {data.blocker ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      {String(data.blocker)}
                    </span>
                  ) : null}
                  {data.interviewGoal ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--gray-100)] text-[var(--gray-600)]">
                      {Number(data.interviewGoal)} interviews
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
          {users.length === 0 && (
            <div className="px-6 py-12 text-center text-[var(--gray-600)]">
              No users have completed onboarding yet.
            </div>
          )}
        </div>
      </div>
          </>
        }
      />
    </div>
  );
}

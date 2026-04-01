import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

async function getOnboardingData() {
  const [users, totalUsers] = await Promise.all([
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
        _count: { select: { resumes: true } },
      },
      orderBy: { onboardingCompletedAt: "desc" },
    }),
    prisma.user.count(),
  ]);

  return { users, totalUsers };
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
  await requireFullAdmin();
  const { users, totalUsers } = await getOnboardingData();

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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* User list */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="divide-y divide-[var(--card-border)]">
          {users.map((user) => {
            let data: Record<string, unknown> = {};
            try { data = JSON.parse(user.onboardingData || "{}"); } catch {}

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
                  {(data.roles as string[] | undefined)?.map((role: string) => (
                    <span key={role} className="text-xs px-2.5 py-1 rounded-full bg-[#ef562a]/10 text-[#ef562a] font-medium">
                      {role}
                    </span>
                  ))}
                  {(data.experience as string[] | undefined)?.map((exp: string) => (
                    <span key={exp} className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {exp}
                    </span>
                  ))}
                  {(data.locations as string[] | undefined)?.map((loc: string) => (
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
    </div>
  );
}

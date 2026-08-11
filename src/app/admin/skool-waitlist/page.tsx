import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const countryNames: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  IN: "India",
  NG: "Nigeria",
  ZA: "South Africa",
  KE: "Kenya",
  GH: "Ghana",
  BR: "Brazil",
  NL: "Netherlands",
  SE: "Sweden",
  JP: "Japan",
  SG: "Singapore",
  IE: "Ireland",
  NZ: "New Zealand",
  ZW: "Zimbabwe",
  UG: "Uganda",
  TZ: "Tanzania",
  RW: "Rwanda",
  ET: "Ethiopia",
};

function getCountryName(code: string): string {
  return countryNames[code] || code;
}

function getTodayStartDenver(): Date {
  const now = new Date();
  const denverTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Denver" })
  );
  const denverMidnight = new Date(
    denverTime.getFullYear(),
    denverTime.getMonth(),
    denverTime.getDate()
  );
  const offset = denverTime.getTime() - now.getTime();
  return new Date(denverMidnight.getTime() - offset);
}

async function getSkoolAnalytics() {
  const todayStart = getTodayStartDenver();
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);

  const [
    uniqueToday,
    uniqueWeek,
    uniqueMonth,
    uniqueAllTime,
    viewsToday,
    viewsWeek,
    viewsMonth,
    viewsAllTime,
    byCountry,
    recentViews,
    dailyViews,
    signupsToday,
    signupsWeek,
    signupsMonth,
    signupsAllTime,
    recentSignups,
    signupsByRole,
  ] = await Promise.all([
    prisma.pagePresence
      .groupBy({
        by: ["visitorId"],
        where: { page: "skool-waitlist", lastSeenAt: { gte: todayStart } },
        _count: true,
      })
      .then((r) => r.length),
    prisma.pagePresence
      .groupBy({
        by: ["visitorId"],
        where: { page: "skool-waitlist", lastSeenAt: { gte: weekStart } },
        _count: true,
      })
      .then((r) => r.length),
    prisma.pagePresence
      .groupBy({
        by: ["visitorId"],
        where: { page: "skool-waitlist", lastSeenAt: { gte: monthStart } },
        _count: true,
      })
      .then((r) => r.length),
    prisma.pagePresence
      .groupBy({
        by: ["visitorId"],
        where: { page: "skool-waitlist" },
        _count: true,
      })
      .then((r) => r.length),
    prisma.blogView.count({
      where: { slug: "skool-waitlist", viewedAt: { gte: todayStart } },
    }),
    prisma.blogView.count({
      where: { slug: "skool-waitlist", viewedAt: { gte: weekStart } },
    }),
    prisma.blogView.count({
      where: { slug: "skool-waitlist", viewedAt: { gte: monthStart } },
    }),
    prisma.blogView.count({ where: { slug: "skool-waitlist" } }),
    prisma.pagePresence.groupBy({
      by: ["country"],
      where: { page: "skool-waitlist", country: { not: null } },
      _count: { visitorId: true },
      orderBy: { _count: { visitorId: "desc" } },
      take: 15,
    }),
    prisma.blogView.findMany({
      where: { slug: "skool-waitlist" },
      orderBy: { viewedAt: "desc" },
      take: 30,
      select: { id: true, viewedAt: true },
    }),
    // Daily view counts for the last 14 days
    prisma.$queryRawUnsafe<{ day: string; count: bigint }[]>(
      `SELECT DATE(viewedAt) as day, COUNT(*) as count FROM BlogView WHERE slug = 'skool-waitlist' AND viewedAt >= ? GROUP BY DATE(viewedAt) ORDER BY day DESC LIMIT 14`,
      monthStart
    ),
    // Form submissions
    prisma.blogView.count({
      where: { slug: "skool-waitlist-signup", viewedAt: { gte: todayStart } },
    }),
    prisma.blogView.count({
      where: { slug: "skool-waitlist-signup", viewedAt: { gte: weekStart } },
    }),
    prisma.blogView.count({
      where: { slug: "skool-waitlist-signup", viewedAt: { gte: monthStart } },
    }),
    prisma.blogView.count({ where: { slug: "skool-waitlist-signup" } }),
    prisma.blogView.findMany({
      where: { slug: "skool-waitlist-signup" },
      orderBy: { viewedAt: "desc" },
      take: 30,
      select: { id: true, title: true, viewedAt: true },
    }),
    prisma.blogView.groupBy({
      by: ["title"],
      where: { slug: "skool-waitlist-signup" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  return {
    uniqueToday,
    uniqueWeek,
    uniqueMonth,
    uniqueAllTime,
    viewsToday,
    viewsWeek,
    viewsMonth,
    viewsAllTime,
    byCountry: byCountry
      .filter((c) => c.country)
      .map((c) => ({
        country: c.country as string,
        countryName: getCountryName(c.country as string),
        visitors: c._count.visitorId,
      })),
    recentViews: recentViews.map((v) => ({
      id: v.id,
      viewedAt: v.viewedAt,
    })),
    dailyViews: dailyViews.map((d) => ({
      day: String(d.day),
      count: Number(d.count),
    })),
    signups: {
      today: signupsToday,
      week: signupsWeek,
      month: signupsMonth,
      allTime: signupsAllTime,
    },
    recentSignups: recentSignups.map((s) => ({
      id: s.id,
      role: s.title?.replace("Skool Signup: ", "") || "Unknown",
      signedUpAt: s.viewedAt,
    })),
    signupsByRole: signupsByRole.map((r) => ({
      role: r.title?.replace("Skool Signup: ", "") || "Unknown",
      count: r._count.id,
    })),
  };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { timeZone: "America/Denver" });
}

export default async function SkoolWaitlistAnalyticsPage() {
  await requireFullAdmin();
  const data = await getSkoolAnalytics();

  const maxDailyCount = Math.max(...data.dailyViews.map((d) => d.count), 1);

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)]">
            Skool Waitlist
          </h1>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--cta-bg)] text-white">
            LAUNCH AUG 17
          </span>
        </div>
        <p className="mt-2 text-[var(--gray-600)]">
          Traffic and engagement for /skool-waitlist
          <span className="ml-2 text-xs bg-[var(--gray-100)] px-2 py-1 rounded-full">
            Mountain Time
          </span>
        </p>
      </div>

      {/* Unique Visitors */}
      <div className="mb-8">
        <h2 className="font-serif text-xl text-[var(--foreground)] mb-4">
          Unique Visitors
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--card-bg)] border-2 border-[var(--accent)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">Today</p>
            <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
              {data.uniqueToday}
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">This Week</p>
            <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
              {data.uniqueWeek}
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">This Month</p>
            <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
              {data.uniqueMonth}
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">All Time</p>
            <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
              {data.uniqueAllTime}
            </p>
          </div>
        </div>
      </div>

      {/* Page Views */}
      <div className="mb-8">
        <h2 className="font-serif text-xl text-[var(--foreground)] mb-4">
          Page Views
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--card-bg)] border-2 border-[var(--accent)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">Today</p>
            <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
              {data.viewsToday}
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">This Week</p>
            <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
              {data.viewsWeek}
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">This Month</p>
            <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
              {data.viewsMonth}
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">All Time</p>
            <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
              {data.viewsAllTime}
            </p>
          </div>
        </div>
      </div>

      {/* Form Submissions */}
      <div className="mb-8">
        <h2 className="font-serif text-xl text-[var(--foreground)] mb-4">
          Form Submissions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--card-bg)] border-2 border-[var(--accent)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">Today</p>
            <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
              {data.signups.today}
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">This Week</p>
            <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
              {data.signups.week}
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">This Month</p>
            <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
              {data.signups.month}
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">All Time</p>
            <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
              {data.signups.allTime}
            </p>
          </div>
        </div>
        {data.uniqueAllTime > 0 && (
          <div className="mt-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 inline-block">
            <p className="text-sm text-[var(--gray-600)]">Conversion Rate</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {((data.signups.allTime / data.uniqueAllTime) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-[var(--gray-600)] mt-1">
              {data.signups.allTime} signups / {data.uniqueAllTime} unique visitors
            </p>
          </div>
        )}
      </div>

      {/* Daily Views Chart */}
      {data.dailyViews.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-xl text-[var(--foreground)] mb-4">
            Daily Views (Last 14 Days)
          </h2>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
            <div className="flex items-end gap-2 h-40">
              {data.dailyViews
                .slice()
                .reverse()
                .map((d) => {
                  const height = Math.max(
                    (d.count / maxDailyCount) * 100,
                    4
                  );
                  const dateLabel = new Date(d.day + "T12:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <div
                      key={d.day}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs font-medium text-[var(--foreground)]">
                        {d.count}
                      </span>
                      <div
                        className="w-full rounded-t bg-[var(--cta-bg)]"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-[var(--gray-600)] whitespace-nowrap">
                        {dateLabel}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Signups by Role + Recent Signups */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--card-border)]">
            <h3 className="font-semibold text-[var(--foreground)]">
              Signups by Role
            </h3>
            <p className="text-xs text-[var(--gray-600)] mt-0.5">
              All time breakdown
            </p>
          </div>
          <div className="divide-y divide-[var(--card-border)] max-h-80 overflow-y-auto">
            {data.signupsByRole.length === 0 ? (
              <p className="px-4 py-8 text-center text-[var(--gray-600)]">
                No signups yet
              </p>
            ) : (
              data.signupsByRole.map((r) => {
                const pct = data.signups.allTime > 0
                  ? ((r.count / data.signups.allTime) * 100).toFixed(0)
                  : "0";
                return (
                  <div
                    key={r.role}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <span className="text-sm text-[var(--foreground)] truncate">
                      {r.role}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs text-[var(--gray-600)]">
                        {pct}%
                      </span>
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        {r.count}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--card-border)]">
            <h3 className="font-semibold text-[var(--foreground)]">
              Recent Signups
            </h3>
            <p className="text-xs text-[var(--gray-600)] mt-0.5">
              Last 30 form submissions
            </p>
          </div>
          <div className="divide-y divide-[var(--card-border)] max-h-80 overflow-y-auto">
            {data.recentSignups.length === 0 ? (
              <p className="px-4 py-8 text-center text-[var(--gray-600)]">
                No signups yet
              </p>
            ) : (
              data.recentSignups.map((s) => (
                <div
                  key={s.id}
                  className="px-4 py-2.5 flex items-center justify-between"
                >
                  <span className="text-sm text-[var(--foreground)] truncate">
                    {s.role}
                  </span>
                  <span className="text-xs text-[var(--gray-600)] flex-shrink-0 ml-2">
                    {formatTimeAgo(new Date(s.signedUpAt))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Visitors by Country */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--card-border)]">
            <h3 className="font-semibold text-[var(--foreground)]">
              Visitors by Country
            </h3>
            <p className="text-xs text-[var(--gray-600)] mt-0.5">
              All time unique visitors
            </p>
          </div>
          <div className="divide-y divide-[var(--card-border)] max-h-80 overflow-y-auto">
            {data.byCountry.length === 0 ? (
              <p className="px-4 py-8 text-center text-[var(--gray-600)]">
                No country data yet
              </p>
            ) : (
              data.byCountry.map((country, index) => (
                <div
                  key={country.country}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--gray-100)] flex items-center justify-center text-xs font-medium text-[var(--gray-600)]">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm text-[var(--foreground)]">
                      {country.countryName}
                    </span>
                  </div>
                  <span className="flex-shrink-0 ml-2 text-sm font-semibold text-[var(--foreground)]">
                    {country.visitors}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Page Views */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--card-border)]">
            <h3 className="font-semibold text-[var(--foreground)]">
              Recent Page Views
            </h3>
            <p className="text-xs text-[var(--gray-600)] mt-0.5">
              Last 30 views
            </p>
          </div>
          <div className="divide-y divide-[var(--card-border)] max-h-80 overflow-y-auto">
            {data.recentViews.length === 0 ? (
              <p className="px-4 py-8 text-center text-[var(--gray-600)]">
                No views yet
              </p>
            ) : (
              data.recentViews.map((view) => (
                <div
                  key={view.id}
                  className="px-4 py-2.5 flex items-center justify-between"
                >
                  <span className="text-sm text-[var(--foreground)]">
                    Page view
                  </span>
                  <span className="text-xs text-[var(--gray-600)]">
                    {formatTimeAgo(new Date(view.viewedAt))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

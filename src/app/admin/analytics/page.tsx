import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Country code to name mapping
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

async function getAnalytics() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [
    // Site-wide metrics
    totalUniqueVisitors,
    activeVisitors,
    todayVisitors,
    weekVisitors,
    monthVisitors,
    visitorsByPage,
    visitorsByCountry,
    // Blog metrics
    totalBlogViews,
    todayBlogViews,
    weekBlogViews,
    blogViewsByPost,
    // Link clicks
    totalLinkClicks,
    todayLinkClicks,
    weekLinkClicks,
    monthLinkClicks,
    linkClicksByLink,
    recentLinkClicks,
    // Job clicks
    totalJobClicks,
    todayJobClicks,
    jobClicksByCompany,
    // Activity metrics
    totalUsers,
    todayLessonCompletions,
    weekLessonCompletions,
    todayMicroWins,
    weekMicroWins,
  ] = await Promise.all([
    // Site-wide metrics
    prisma.pagePresence.groupBy({
      by: ["visitorId"],
      _count: true,
    }).then(r => r.length),
    prisma.pagePresence.groupBy({
      by: ["visitorId"],
      where: { lastSeenAt: { gte: fiveMinutesAgo } },
      _count: true,
    }).then(r => r.length),
    prisma.pagePresence.groupBy({
      by: ["visitorId"],
      where: { lastSeenAt: { gte: todayStart } },
      _count: true,
    }).then(r => r.length),
    prisma.pagePresence.groupBy({
      by: ["visitorId"],
      where: { lastSeenAt: { gte: weekStart } },
      _count: true,
    }).then(r => r.length),
    prisma.pagePresence.groupBy({
      by: ["visitorId"],
      where: { lastSeenAt: { gte: monthStart } },
      _count: true,
    }).then(r => r.length),
    prisma.pagePresence.groupBy({
      by: ["page"],
      where: { lastSeenAt: { gte: weekStart } },
      _count: { visitorId: true },
      orderBy: { _count: { visitorId: "desc" } },
      take: 10,
    }),
    prisma.pagePresence.groupBy({
      by: ["country"],
      where: { country: { not: null } },
      _count: { visitorId: true },
      orderBy: { _count: { visitorId: "desc" } },
      take: 15,
    }),
    // Blog metrics
    prisma.blogView.count(),
    prisma.blogView.count({ where: { viewedAt: { gte: todayStart } } }),
    prisma.blogView.count({ where: { viewedAt: { gte: weekStart } } }),
    prisma.blogView.groupBy({
      by: ["slug", "title"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    // Link clicks
    prisma.linkClick.count(),
    prisma.linkClick.count({ where: { clickedAt: { gte: todayStart } } }),
    prisma.linkClick.count({ where: { clickedAt: { gte: weekStart } } }),
    prisma.linkClick.count({ where: { clickedAt: { gte: monthStart } } }),
    prisma.linkClick.groupBy({
      by: ["linkId", "linkTitle"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.linkClick.findMany({
      orderBy: { clickedAt: "desc" },
      take: 20,
      select: {
        id: true,
        linkTitle: true,
        linkUrl: true,
        clickedAt: true,
      },
    }),
    // Job clicks
    prisma.jobClick.count(),
    prisma.jobClick.count({ where: { clickedAt: { gte: todayStart } } }),
    prisma.jobClick.groupBy({
      by: ["company"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    // Activity metrics
    prisma.user.count(),
    prisma.lessonProgress.count({
      where: { completed: true, completedAt: { gte: todayStart } },
    }),
    prisma.lessonProgress.count({
      where: { completed: true, completedAt: { gte: weekStart } },
    }),
    prisma.microWin.count({
      where: { status: "approved", createdAt: { gte: todayStart } },
    }),
    prisma.microWin.count({
      where: { status: "approved", createdAt: { gte: weekStart } },
    }),
  ]);

  return {
    site: {
      totalVisitors: totalUniqueVisitors,
      activeNow: activeVisitors,
      today: todayVisitors,
      week: weekVisitors,
      month: monthVisitors,
      byPage: visitorsByPage.map((p) => ({
        page: p.page,
        visitors: p._count.visitorId,
      })),
      byCountry: visitorsByCountry
        .filter((c) => c.country)
        .map((c) => ({
          country: c.country as string,
          countryName: getCountryName(c.country as string),
          visitors: c._count.visitorId,
        })),
    },
    blog: {
      total: totalBlogViews,
      today: todayBlogViews,
      week: weekBlogViews,
      byPost: blogViewsByPost.map((v) => ({
        slug: v.slug,
        title: v.title,
        views: v._count.id,
      })),
    },
    links: {
      total: totalLinkClicks,
      today: todayLinkClicks,
      week: weekLinkClicks,
      month: monthLinkClicks,
      byLink: linkClicksByLink.map((c) => ({
        linkId: c.linkId,
        linkTitle: c.linkTitle,
        clicks: c._count.id,
      })),
      recent: recentLinkClicks,
    },
    jobs: {
      total: totalJobClicks,
      today: todayJobClicks,
      byCompany: jobClicksByCompany.map((c) => ({
        company: c.company,
        clicks: c._count.id,
      })),
    },
    activity: {
      totalUsers,
      lessonCompletionsToday: todayLessonCompletions,
      lessonCompletionsWeek: weekLessonCompletions,
      microWinsToday: todayMicroWins,
      microWinsWeek: weekMicroWins,
    },
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
  return date.toLocaleDateString();
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Site-wide analytics, audience demographics, and engagement metrics
        </p>
      </div>

      {/* Site Visitors Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Site Visitors
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Now</p>
            <p className="text-3xl font-bold text-green-600">
              {analytics.site.activeNow}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
            <p className="text-3xl font-bold text-blue-600">
              {analytics.site.today}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
            <p className="text-3xl font-bold text-purple-600">
              {analytics.site.week}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
            <p className="text-3xl font-bold text-orange-600">
              {analytics.site.month}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">All Time</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics.site.totalVisitors}
            </p>
          </div>
        </div>
      </div>

      {/* Audience & Activity Row */}
      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Audience by Country */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Audience by Country
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
            {analytics.site.byCountry.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No country data yet
              </p>
            ) : (
              analytics.site.byCountry.map((country, index) => (
                <div
                  key={country.country}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm text-gray-900 dark:text-white">
                      {country.countryName}
                    </span>
                  </div>
                  <span className="flex-shrink-0 ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {country.visitors}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Traffic by Page */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Traffic by Page (7 days)
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
            {analytics.site.byPage.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No page data yet
              </p>
            ) : (
              analytics.site.byPage.map((page, index) => (
                <div
                  key={page.page}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm text-gray-900 dark:text-white">
                      /{page.page}
                    </span>
                  </div>
                  <span className="flex-shrink-0 ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {page.visitors}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Community Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Community Activity
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Registered Users</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{analytics.activity.totalUsers}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Lesson Completions</p>
              <div className="flex gap-4">
                <div>
                  <p className="text-lg font-bold text-green-600">{analytics.activity.lessonCompletionsToday}</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">{analytics.activity.lessonCompletionsWeek}</p>
                  <p className="text-xs text-gray-500">This Week</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Micro Wins Shared</p>
              <div className="flex gap-4">
                <div>
                  <p className="text-lg font-bold text-green-600">{analytics.activity.microWinsToday}</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">{analytics.activity.microWinsWeek}</p>
                  <p className="text-xs text-gray-500">This Week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Blog Views
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics.blog.total}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
            <p className="text-3xl font-bold text-green-600">
              {analytics.blog.today}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
            <p className="text-3xl font-bold text-blue-600">
              {analytics.blog.week}
            </p>
          </div>
        </div>
        {analytics.blog.byPost.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Top Blog Posts
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {analytics.blog.byPost.map((post, index) => (
                <div
                  key={post.slug}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm text-gray-900 dark:text-white">
                      {post.title}
                    </span>
                  </div>
                  <span className="flex-shrink-0 ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {post.views}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Link Click Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Link Clicks
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics.links.total}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
            <p className="text-3xl font-bold text-green-600">
              {analytics.links.today}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
            <p className="text-3xl font-bold text-blue-600">
              {analytics.links.week}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
            <p className="text-3xl font-bold text-purple-600">
              {analytics.links.month}
            </p>
          </div>
        </div>
      </div>

      {/* Job Click Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Job Clicks
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics.jobs.total}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
            <p className="text-3xl font-bold text-green-600">
              {analytics.jobs.today}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Links */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Top Links
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {analytics.links.byLink.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No link clicks yet
              </p>
            ) : (
              analytics.links.byLink.map((link, index) => (
                <div
                  key={link.linkId}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm text-gray-900 dark:text-white">
                      {link.linkTitle}
                    </span>
                  </div>
                  <span className="flex-shrink-0 ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {link.clicks}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Companies (Job Clicks) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Top Companies (Job Clicks)
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {analytics.jobs.byCompany.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No job clicks yet
              </p>
            ) : (
              analytics.jobs.byCompany.map((company, index) => (
                <div
                  key={company.company}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm text-gray-900 dark:text-white">
                      {company.company}
                    </span>
                  </div>
                  <span className="flex-shrink-0 ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {company.clicks}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Link Clicks */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Recent Link Clicks
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
          {analytics.links.recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No recent clicks
            </p>
          ) : (
            analytics.links.recent.map((click) => (
              <div key={click.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {click.linkTitle}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                    {formatTimeAgo(new Date(click.clickedAt))}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                  {click.linkUrl}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

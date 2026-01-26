import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Get start of today in Denver timezone (Mountain Time)
function getTodayStartDenver(): Date {
  const now = new Date();
  const denverTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Denver" }));
  const denverMidnight = new Date(denverTime.getFullYear(), denverTime.getMonth(), denverTime.getDate());
  const offset = denverTime.getTime() - now.getTime();
  return new Date(denverMidnight.getTime() - offset);
}

async function getStats() {
  const todayStart = getTodayStartDenver();
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [
    jobsCount,
    activeJobsCount,
    linksCount,
    activeLinksCount,
    blogPostsCount,
    // Analytics
    activeVisitors,
    todayVisitors,
    weekVisitors,
    totalVisitors,
    todayBlogViews,
    weekBlogViews,
    todayLinkClicks,
    todayJobClicks,
    usersCount,
  ] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { isActive: true } }),
    prisma.link.count(),
    prisma.link.count({ where: { isActive: true } }),
    prisma.blogPost.count(),
    // Analytics
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
      _count: true,
    }).then(r => r.length),
    prisma.blogView.count({ where: { viewedAt: { gte: todayStart } } }),
    prisma.blogView.count({ where: { viewedAt: { gte: weekStart } } }),
    prisma.linkClick.count({ where: { clickedAt: { gte: todayStart } } }),
    prisma.jobClick.count({ where: { clickedAt: { gte: todayStart } } }),
    prisma.user.count(),
  ]);

  return {
    jobsCount,
    activeJobsCount,
    linksCount,
    activeLinksCount,
    blogPostsCount,
    analytics: {
      activeVisitors,
      todayVisitors,
      weekVisitors,
      totalVisitors,
      todayBlogViews,
      weekBlogViews,
      todayLinkClicks,
      todayJobClicks,
      usersCount,
    },
  };
}

export default async function AdminDashboard() {
  await requireFullAdmin();
  const stats = await getStats();

  const contentCards = [
    {
      name: "Jobs",
      value: stats.jobsCount,
      subtext: `${stats.activeJobsCount} active`,
      href: "/admin/jobs",
      color: "bg-[#1a1a1a]",
      icon: (
        <svg className="h-6 w-6 text-[#ffe500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: "Links",
      value: stats.linksCount,
      subtext: `${stats.activeLinksCount} active`,
      href: "/admin/links",
      color: "bg-[var(--gray-100)]",
      icon: (
        <svg className="h-6 w-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      name: "Blog Posts",
      value: stats.blogPostsCount,
      subtext: "published",
      href: "/admin/blog",
      color: "bg-[#ffe500]",
      icon: (
        <svg className="h-6 w-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)]">
          Dashboard
        </h1>
        <p className="mt-2 text-[var(--gray-600)]">
          Site overview and analytics
        </p>
      </div>

      {/* Live Stats Banner */}
      <div className="mb-8 bg-[#1a1a1a] rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <h2 className="font-serif text-xl text-white">Live Activity</h2>
            <p className="text-gray-400 text-sm mt-1">Real-time site statistics</p>
          </div>
          <div className="flex gap-6 md:gap-10">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-[#ffe500]">{stats.analytics.activeVisitors}</p>
              <p className="text-gray-400 text-sm mt-1">Active Now</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white">{stats.analytics.todayVisitors}</p>
              <p className="text-gray-400 text-sm mt-1">Today</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white">{stats.analytics.weekVisitors}</p>
              <p className="text-gray-400 text-sm mt-1">This Week</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white">{stats.analytics.totalVisitors}</p>
              <p className="text-gray-400 text-sm mt-1">All Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-[var(--foreground)]">
            Today&apos;s Activity
          </h2>
          <Link
            href="/admin/analytics"
            className="text-sm text-[var(--foreground)] hover:underline"
          >
            View Full Analytics
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">Registered Users</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {stats.analytics.usersCount}
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">Blog Views Today</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {stats.analytics.todayBlogViews}
            </p>
            <p className="text-xs text-[var(--gray-600)]">{stats.analytics.weekBlogViews} this week</p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">Link Clicks Today</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {stats.analytics.todayLinkClicks}
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">Job Clicks Today</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {stats.analytics.todayJobClicks}
            </p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--gray-600)]">Visitors Today</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {stats.analytics.todayVisitors}
            </p>
          </div>
        </div>
      </div>

      {/* Content Stats Grid */}
      <div className="mb-8">
        <h2 className="font-serif text-xl text-[var(--foreground)] mb-4">
          Content Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contentCards.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="group relative overflow-hidden rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] px-5 py-5 hover:border-black transition-colors"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-full p-3 ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm text-[var(--gray-600)]">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline mt-1">
                      <div className="text-2xl font-bold text-[var(--foreground)]">
                        {stat.value}
                      </div>
                      <div className="ml-2 text-sm text-[var(--gray-600)]">
                        {stat.subtext}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="font-serif text-xl text-[var(--foreground)] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/jobs/new"
            className="flex items-center justify-center px-5 py-3.5 bg-[#ffe500] text-black rounded-full text-sm font-medium hover:bg-[#f5dc00] transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add New Job
          </Link>
          <Link
            href="/admin/links/new"
            className="flex items-center justify-center px-5 py-3.5 border border-[var(--card-border)] rounded-full text-sm font-medium text-[var(--foreground)] bg-[var(--card-bg)] hover:border-black hover:text-black transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add New Link
          </Link>
          <Link
            href="/admin/blog/new"
            className="flex items-center justify-center px-5 py-3.5 border border-[var(--card-border)] rounded-full text-sm font-medium text-[var(--foreground)] bg-[var(--card-bg)] hover:border-black hover:text-black transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Blog Post
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center justify-center px-5 py-3.5 border border-[var(--card-border)] rounded-full text-sm font-medium text-[var(--foreground)] bg-[var(--card-bg)] hover:border-black hover:text-black transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}

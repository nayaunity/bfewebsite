import { prisma } from "@/lib/prisma";
import { getAllPostsMeta } from "@/lib/blog";

export const dynamic = "force-dynamic";

async function getAnalytics() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);

  const [
    totalLinkClicks,
    todayLinkClicks,
    weekLinkClicks,
    monthLinkClicks,
    linkClicksByLink,
    recentLinkClicks,
    totalJobClicks,
    todayJobClicks,
    jobClicksByCompany,
    // Blog views
    totalBlogViews,
    todayBlogViews,
    weekBlogViews,
    blogViewsByPost,
    recentBlogViews,
  ] = await Promise.all([
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
    // Blog views
    prisma.blogView.count(),
    prisma.blogView.count({ where: { viewedAt: { gte: todayStart } } }),
    prisma.blogView.count({ where: { viewedAt: { gte: weekStart } } }),
    prisma.blogView.groupBy({
      by: ["slug", "title"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.blogView.findMany({
      orderBy: { viewedAt: "desc" },
      take: 20,
      select: {
        id: true,
        slug: true,
        title: true,
        viewedAt: true,
      },
    }),
  ]);

  // Get all blog posts for the complete list
  const allBlogPosts = getAllPostsMeta();

  return {
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
    blog: {
      total: totalBlogViews,
      today: todayBlogViews,
      week: weekBlogViews,
      byPost: blogViewsByPost.map((v) => ({
        slug: v.slug,
        title: v.title,
        views: v._count.id,
      })),
      recent: recentBlogViews,
      allPosts: allBlogPosts,
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
          Track clicks and engagement across your site
        </p>
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

      {/* Blog Views Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Blog Views
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Blog Analytics Section */}
      <div className="mt-8 grid lg:grid-cols-2 gap-8">
        {/* Top Blog Posts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Top Blog Posts
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {analytics.blog.byPost.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No blog views yet
              </p>
            ) : (
              analytics.blog.byPost.map((post, index) => (
                <div
                  key={post.slug}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-xs font-medium text-orange-600 dark:text-orange-300">
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
              ))
            )}
          </div>
        </div>

        {/* All Blog Posts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              All Blog Posts ({analytics.blog.allPosts.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {analytics.blog.allPosts.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No blog posts yet
              </p>
            ) : (
              analytics.blog.allPosts.map((post) => (
                <div key={post.slug} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {post.title}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 flex-shrink-0 ml-2">
                      {post.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(post.publishedAt).toLocaleDateString()} · {post.readTime}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Blog Views */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Recent Blog Views
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
          {analytics.blog.recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No recent views
            </p>
          ) : (
            analytics.blog.recent.map((view) => (
              <div key={view.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {view.title}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                    {formatTimeAgo(new Date(view.viewedAt))}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                  /blog/{view.slug}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

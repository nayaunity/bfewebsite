import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import { PortfolioGenerator } from "@/components/portfolio/PortfolioGenerator";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Portfolio | The Black Female Engineer",
  description: "Generate your AI-powered portfolio with unique 3D visuals from your resume.",
};

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      resumeUrl: true,
      subscriptionTier: true,
      portfolio: {
        select: {
          id: true,
          slug: true,
          status: true,
          headline: true,
          isPublished: true,
          lastGeneratedAt: true,
          heroImageUrl: true,
          assets: { select: { id: true, section: true, blobUrl: true } },
        },
      },
    },
  });

  if (!user) redirect("/signin");

  const tier = user.subscriptionTier || "free";
  const portfolio = user.portfolio;
  const hasExisting = portfolio && portfolio.status === "ready";

  return (
    <>
      <PagePresenceTracker page="portfolio" />
      <Navigation />
      <main className="min-h-screen bg-[var(--background)] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-[var(--foreground)]">
              My <span className="text-[#ef562a] italic">Portfolio</span>
            </h1>
            <p className="text-[var(--gray-600)] mt-2">
              A professional portfolio generated from your resume with AI-powered visuals.
            </p>
          </div>

          {hasExisting ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[var(--foreground)]">
                    {portfolio.headline || "Your Portfolio"}
                  </h2>
                  <p className="text-sm text-[var(--gray-600)] mt-1">
                    {portfolio.isPublished ? (
                      <span className="text-green-600 font-semibold">Published</span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">Draft</span>
                    )}
                    {portfolio.lastGeneratedAt && (
                      <span className="ml-2">
                        Generated {new Date(portfolio.lastGeneratedAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/portfolio/${portfolio.slug}`}
                    className="px-4 py-2 bg-[#ef562a] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    View
                  </Link>
                  <Link
                    href="/portfolio/customize"
                    className="px-4 py-2 bg-[var(--gray-100)] text-[var(--foreground)] text-sm font-semibold rounded-xl hover:bg-[var(--gray-200)] transition-colors"
                  >
                    Customize
                  </Link>
                </div>
              </div>

              {portfolio.heroImageUrl && (
                <div className="rounded-xl overflow-hidden border border-[var(--card-border)]">
                  <img
                    src={portfolio.heroImageUrl}
                    alt="Portfolio hero"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {portfolio.assets.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {portfolio.assets
                    .filter((a) => a.section !== "hero")
                    .slice(0, 3)
                    .map((asset) => (
                      <div key={asset.id} className="rounded-lg overflow-hidden border border-[var(--card-border)]">
                        <img
                          src={asset.blobUrl}
                          alt={asset.section}
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[var(--card-border)]">
                <PortfolioGenerator hasResume={!!user.resumeUrl} tier={tier} />
              </div>
            </div>
          ) : (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8">
              <PortfolioGenerator hasResume={!!user.resumeUrl} tier={tier} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

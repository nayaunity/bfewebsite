import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import { PortfolioCustomizeClient } from "./PortfolioCustomizeClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Customize Portfolio | The Black Female Engineer",
};

export default async function CustomizePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      slug: true,
      headline: true,
      bio: true,
      isPublished: true,
      colorPalette: true,
      heroImageUrl: true,
    },
  });

  if (!portfolio || !portfolio.headline) {
    redirect("/portfolio");
  }

  return (
    <>
      <PagePresenceTracker page="portfolio-customize" />
      <Navigation />
      <main className="min-h-screen bg-[var(--background)] pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-serif font-bold text-[var(--foreground)] mb-2">
            Customize <span className="text-[#ef562a] italic">Portfolio</span>
          </h1>
          <p className="text-[var(--gray-600)] mb-8">
            Edit your headline, bio, and publish settings.
          </p>

          <PortfolioCustomizeClient
            portfolioId={portfolio.id}
            slug={portfolio.slug}
            headline={portfolio.headline}
            bio={portfolio.bio || ""}
            isPublished={portfolio.isPublished}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

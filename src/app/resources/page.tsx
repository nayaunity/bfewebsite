import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";

export const metadata = {
  title: "Resources | The Black Female Engineer",
  description: "Free resources on AI, career growth, and building income for people ready to level up.",
  openGraph: {
    title: "Resources | The Black Female Engineer",
    description: "Free resources on AI, career growth, and building income for people ready to level up.",
    url: "/resources",
    type: "website",
    images: [{ url: "/images/bfeimage2.png", alt: "The Black Female Engineer" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Resources | The Black Female Engineer",
    description: "Free resources on AI, career growth, and building income for people ready to level up.",
    images: ["/images/bfeimage2.png"],
  },
};

export default function ResourcesPage() {
  const resourceCategories = [
    {
      title: "AI & Skills",
      description: "Learn to use AI to build, earn, and grow.",
      items: [
        { name: "The $60K/Month Blueprint", description: "The business model, systems, and AI leverage behind building a $60K/month business", tag: "New", href: "/blog/60-k-business-breakdown" },
        { name: "The 3-Hour Workday Ebook", description: "A step-by-step guide to using AI to reclaim your time with a 5-phase system", tag: "Featured", href: "/resources/3-hour-workday" },
        { name: "Claude Code 101", description: "Your beginner's guide to building with AI in the terminal", tag: "Beginner", href: "/resources/claude-code-101" },
        { name: "Claude Architect Mock Exam", description: "48-question practice exam for Claude Certified Architect certification", tag: "Featured", href: "/resources/claude-architect-exam" },
        { name: "AI Money Stack Quiz", description: "Find which AI tools + business model fits your skills and goals", tag: "Featured", href: "/resources/ai-money-quiz" },
      ],
    },
    {
      title: "Career & Income",
      description: "Actionable advice for earning more and growing your career.",
      items: [
        { name: "Resume & LinkedIn", description: "Stand out to recruiters and hiring managers", tag: "Essential", href: "/resources/resume-linkedin" },
        { name: "Personal Branding", description: "Build your reputation and attract opportunities", tag: "Growth", href: "/resources/personal-branding" },
        { name: "Salary Negotiation Guide", description: "Get paid what you're worth", tag: "Essential", href: "/resources/salary-negotiation" },
        { name: "Gaining Experience Without Experience", description: "Build your portfolio through projects, open source, and more", tag: "Beginner", href: "/resources/gaining-experience" },
      ],
    },
  ];

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      "Popular": "bg-[#4d1b27] text-white",
      "Free": "bg-[var(--accent-green-bg)] text-[var(--accent-green-text)]",
      "Essential": "bg-[var(--gray-100)] text-[var(--foreground)]",
      "Advanced": "bg-[var(--accent-purple-bg)] text-[var(--accent-purple-text)]",
      "Beginner": "bg-[var(--accent-blue-bg)] text-[var(--accent-blue-text)]",
      "In-Demand": "bg-[#4d1b27]/10 text-[#4d1b27]",
      "Trending": "bg-pink-100 text-pink-800",
      "Growth": "bg-teal-100 text-teal-800",
      "Hot": "bg-red-100 text-red-800",
      "Featured": "bg-[#4d1b27] text-white",
      "New": "bg-emerald-100 text-emerald-800",
      "Goal": "bg-indigo-100 text-indigo-800",
    };
    return colors[tag] || "bg-[var(--gray-100)] text-[var(--foreground)]";
  };

  return (
    <>
      <PagePresenceTracker page="resources" />
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero */}
        <section className="bg-[var(--background)] pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                Free <span className="italic text-[#4d1b27]">resources</span>
                <br />
                to level up
              </h1>
              <p className="mt-6 text-xl text-[var(--gray-600)]">
                Guides, tools, and strategies on AI, career growth, and building income.
              </p>
            </div>
          </div>
        </section>

        {/* Resource Categories */}
        {resourceCategories.map((category, categoryIndex) => (
          <section
            key={categoryIndex}
            className={categoryIndex % 2 === 0 ? "bg-[var(--gray-50)] py-16 md:py-24" : "bg-[var(--background)] py-16 md:py-24"}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-12">
                <h2 className="font-serif text-3xl md:text-4xl">{category.title}</h2>
                <p className="mt-2 text-[var(--gray-600)]">{category.description}</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map((item, itemIndex) => (
                  <Link
                    key={itemIndex}
                    href={item.href || "#"}
                    className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] hover:border-[#4d1b27] hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTagColor(item.tag)}`}>
                        {item.tag}
                      </span>
                      <svg
                        className="w-5 h-5 text-[var(--gray-200)] group-hover:text-[#4d1b27] transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-xl group-hover:text-[#4d1b27] transition-colors">
                      {item.name}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--gray-600)]">{item.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="bg-[#2a2828] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Have something to share?
            </h2>
            <p className="text-white/60 mb-8">
              Help inspire the next generation of innovators with your knowledge.
            </p>
            <Link
              href="/resources/submit"
              className="inline-block bg-[#4d1b27] text-white px-8 py-4 rounded-full font-medium hover:bg-[#4d383b] transition-colors"
            >
              Submit a Resource
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

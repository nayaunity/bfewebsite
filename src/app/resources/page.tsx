import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";

export const metadata = {
  title: "Resources | The Black Female Engineer",
  description: "Free resources on tech, coding, career growth, and finance for young professionals making their mark.",
};

export default function ResourcesPage() {
  const resourceCategories = [
    {
      title: "Tech & Coding",
      description: "Hands-on projects and practical tech applications for everyday life.",
      items: [
        { name: "Web Development", description: "HTML, CSS, JavaScript, and modern frameworks", tag: "Beginner", href: "/resources/web-development" },
        { name: "System Design Guide", description: "Learn to design scalable systems from scratch", tag: "Advanced", href: "/resources/system-design" },
        { name: "Claude Code 101", description: "Your beginner's guide to building with AI in the terminal", tag: "Beginner", href: "/resources/claude-code-101" },
        // { name: "Coding Tutorials", description: "Step-by-step guides for building real projects", tag: "Popular" },
        // { name: "App Development", description: "Build your next big app from idea to launch", tag: "Trending" },
        // { name: "Cloud & DevOps", description: "Get hands-on with AWS, GCP, and deployment", tag: "In-Demand" },
        // { name: "AI & Machine Learning", description: "Practical ML tools and applications", tag: "Hot" },
      ],
    },
    {
      title: "Career Growth",
      description: "Actionable advice for breaking into tech and leveling up.",
      items: [
        { name: "Breaking Into Tech", description: "Strategies for landing your first tech role", tag: "Featured", href: "/resources/break-into-tech" },
        { name: "Interview Prep", description: "Ace technical and behavioral interviews", tag: "Popular", href: "/resources/interview-prep" },
        { name: "Resume & LinkedIn", description: "Stand out to recruiters and hiring managers", tag: "Essential", href: "/resources/resume-linkedin" },
        { name: "Personal Branding", description: "Build your reputation in the tech industry", tag: "Growth", href: "/resources/personal-branding" },
        { name: "Gaining Experience Without Experience", description: "Build your portfolio through projects, open source, and more", tag: "Beginner", href: "/resources/gaining-experience" },
        { name: "GitHub Essentials", description: "Optimize your GitHub for recruiters, not developers", tag: "Essential", href: "/resources/github-essentials" },
      ],
    },
    // {
    //   title: "Finance",
    //   description: "Financial strategies for building wealth in tech.",
    //   items: [
    //     { name: "Entrepreneurship", description: "Start and scale your own tech venture", tag: "New" },
    //     { name: "Tech Stock Options", description: "Understanding equity and RSUs", tag: "Essential" },
    //     { name: "Investing Basics", description: "Build wealth with smart investing", tag: "Beginner" },
    //     { name: "Side Income in Tech", description: "Monetize your skills outside your 9-5", tag: "Trending" },
    //     { name: "Tax Strategies", description: "Maximize your take-home pay", tag: "Advanced" },
    //     { name: "Financial Independence", description: "Roadmap to FIRE in tech", tag: "Goal" },
    //   ],
    // },
  ];

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      "Popular": "bg-[#ffe500] text-black",
      "Free": "bg-[var(--accent-green-bg)] text-[var(--accent-green-text)]",
      "Essential": "bg-[var(--gray-100)] text-[var(--foreground)]",
      "Advanced": "bg-[var(--accent-purple-bg)] text-[var(--accent-purple-text)]",
      "Beginner": "bg-[var(--accent-blue-bg)] text-[var(--accent-blue-text)]",
      "In-Demand": "bg-[#ef562a]/10 text-[#ef562a]",
      "Trending": "bg-pink-100 text-pink-800",
      "Growth": "bg-teal-100 text-teal-800",
      "Hot": "bg-red-100 text-red-800",
      "Featured": "bg-[#ffe500] text-black",
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
                Free <span className="italic text-[#ef562a]">resources</span>
                <br />
                to make an impact
              </h1>
              <p className="mt-6 text-xl text-[var(--gray-600)]">
                Actionable tools and guides on tech, coding, career growth, and finance for young professionals.
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
                    className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] hover:border-[#ffe500] hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTagColor(item.tag)}`}>
                        {item.tag}
                      </span>
                      <svg
                        className="w-5 h-5 text-[var(--gray-200)] group-hover:text-[#ef562a] transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-xl group-hover:text-[#ef562a] transition-colors">
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
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Have something to share?
            </h2>
            <p className="text-white/60 mb-8">
              Help inspire the next generation of innovators with your knowledge.
            </p>
            <Link
              href="/resources/submit"
              className="inline-block bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
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

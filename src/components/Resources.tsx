import Link from "next/link";
import { ChromeStar, PinkFolder } from "@/components/brand";

export default function Resources() {
  const resources = [
    {
      category: "AI & Skills",
      items: [
        { name: "The $60K/Month Blueprint", href: "/blog/60-k-business-breakdown" },
        { name: "The 3-Hour Workday Ebook", href: "/resources/3-hour-workday" },
        { name: "Claude Code 101", href: "/resources/claude-code-101" },
        { name: "Claude Architect Mock Exam", href: "/resources/claude-architect-exam" },
        { name: "AI Money Stack Quiz", href: "/resources/ai-money-quiz" },
      ],
    },
    {
      category: "Career & Income",
      items: [
        { name: "Resume & LinkedIn", href: "/resources/resume-linkedin" },
        { name: "Salary Negotiation Guide", href: "/resources/salary-negotiation" },
        { name: "Personal Branding", href: "/resources/personal-branding" },
        { name: "Gaining Experience", href: "/resources/gaining-experience" },
      ],
    },
    {
      category: "Community",
      items: [
        { name: "Meet the Community", href: "/community" },
        { name: "Companies & Creators", href: "/work-with-naya" },
        { name: "Contact Me", href: "/contact" },
      ],
    },
  ];

  return (
    <section id="resources" className="bg-[var(--surface-warm)] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 relative">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl">
            <span className="italic">what</span> THE RESOURCES
            <br />
            <span className="italic">can help you</span> BUILD
          </h2>
          <ChromeStar size={52} rotate={10} className="absolute -top-6 right-1/4 hidden md:block animate-twinkle" />
          <ChromeStar size={28} rotate={-15} className="absolute top-4 right-[15%] hidden md:block animate-twinkle [animation-delay:0.8s]" />
          <PinkFolder size={64} rotate={8} className="absolute -top-2 left-[10%] hidden md:block" />
        </div>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {resources.map((section, index) => (
            <div key={index}>
              <h3 className="text-sm tracking-widest mb-6 pb-4 border-b border-[var(--card-border)]">
                {section.category.toUpperCase()}
              </h3>
              <ul className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Link
                      href={item.href}
                      className="group flex items-center justify-between py-2 hover:text-[var(--accent)] transition-colors"
                    >
                      <span className="font-serif text-xl">{item.name}</span>
                      <svg
                        className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/resources"
            className="inline-block bg-[var(--cta-bg)] text-white px-8 py-4 rounded-full font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            View All Resources
          </Link>
        </div>
      </div>
    </section>
  );
}

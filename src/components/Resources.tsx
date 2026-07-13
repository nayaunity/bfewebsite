import Link from "next/link";

export default function Resources() {
  const resources = [
    {
      category: "AI & Skills",
      items: [
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
        { name: "Work With Me", href: "/work-with-us" },
        { name: "Contact Me", href: "/contact" },
      ],
    },
  ];

  return (
    <section id="resources" className="bg-[var(--background)] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl">
            <span className="italic">what</span> THE RESOURCES
            <br />
            <span className="italic">can help you</span> BUILD
          </h2>
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
                      className="group flex items-center justify-between py-2 hover:text-[#4d1b27] transition-colors"
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
            className="inline-block bg-[#4d1b27] text-white px-8 py-4 rounded-full font-medium hover:bg-[#4d383b] transition-colors"
          >
            View All Resources
          </Link>
        </div>
      </div>
    </section>
  );
}

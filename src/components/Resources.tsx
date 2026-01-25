import Link from "next/link";

export default function Resources() {
  const resources = [
    {
      category: "Learning",
      items: [
        { name: "Technical Interview Prep", href: "/resources/interview-prep" },
        { name: "System Design Guide", href: "/resources/system-design" },
        { name: "Break Into Tech", href: "/resources/break-into-tech" },
        { name: "Web Development Fundamentals", href: "/resources/web-development" },
      ],
    },
    {
      category: "Career",
      items: [
        { name: "Resume & LinkedIn", href: "/resources/resume-linkedin" },
        { name: "Salary Negotiation Guide", href: "/resources/salary-negotiation" },
        { name: "Gaining Experience", href: "/resources/gaining-experience" },
        { name: "Personal Branding", href: "/resources/personal-branding" },
      ],
    },
    {
      category: "Community",
      items: [
        { name: "Meet the Community", href: "/community" },
        { name: "Job Board", href: "/jobs" },
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
            <span className="italic">can help you</span> ACHIEVE
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
                      className="group flex items-center justify-between py-2 hover:text-[#ef562a] transition-colors"
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
            className="inline-block bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
          >
            View All Resources
          </Link>
        </div>
      </div>
    </section>
  );
}

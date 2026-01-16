import Link from "next/link";

export default function Resources() {
  const resources = [
    {
      category: "Learning",
      items: [
        "Technical Interview Prep",
        "System Design Guide",
        "Data Structures & Algorithms",
        "Web Development Fundamentals",
      ],
    },
    {
      category: "Career",
      items: [
        "Resume Templates",
        "Salary Negotiation Guide",
        "LinkedIn Optimization",
        "Personal Branding",
      ],
    },
    {
      category: "Community",
      items: [
        "Mentorship Programs",
        "Networking Events",
        "Slack Community",
        "Local Chapters",
      ],
    },
  ];

  return (
    <section id="resources" className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl">
            <span className="italic">what</span> OUR RESOURCES
            <br />
            <span className="italic">can help you</span> ACHIEVE
          </h2>
        </div>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {resources.map((section, index) => (
            <div key={index}>
              <h3 className="text-sm tracking-widest mb-6 pb-4 border-b border-gray-200">
                {section.category.toUpperCase()}
              </h3>
              <ul className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Link
                      href="#"
                      className="group flex items-center justify-between py-2 hover:text-[#ef562a] transition-colors"
                    >
                      <span className="font-serif text-xl">{item}</span>
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
            href="#"
            className="inline-block bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
          >
            View All Resources
          </Link>
        </div>
      </div>
    </section>
  );
}

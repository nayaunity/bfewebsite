import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Resources | The Black Female Engineer",
  description: "Free resources for Black women in engineering - technical interview prep, career development, and more.",
};

export default function ResourcesPage() {
  const resourceCategories = [
    {
      title: "Technical Skills",
      description: "Build your technical foundation with curated learning materials.",
      items: [
        { name: "Technical Interview Prep", description: "Ace your coding interviews with practice problems and strategies", tag: "Popular" },
        { name: "System Design Guide", description: "Learn to design scalable systems from scratch", tag: "Advanced" },
        { name: "Data Structures & Algorithms", description: "Master the fundamentals of computer science", tag: "Essential" },
        { name: "Web Development Fundamentals", description: "HTML, CSS, JavaScript, and modern frameworks", tag: "Beginner" },
        { name: "Cloud Computing (AWS/GCP)", description: "Get certified in cloud platforms", tag: "In-Demand" },
        { name: "Machine Learning Basics", description: "Introduction to ML concepts and tools", tag: "Trending" },
      ],
    },
    {
      title: "Career Development",
      description: "Tools and guides to advance your engineering career.",
      items: [
        { name: "Resume Templates", description: "ATS-friendly templates designed for engineers", tag: "Free" },
        { name: "Salary Negotiation Guide", description: "Learn to negotiate offers confidently", tag: "Popular" },
        { name: "LinkedIn Optimization", description: "Make your profile stand out to recruiters", tag: "Essential" },
        { name: "Personal Branding", description: "Build your reputation in tech", tag: "Growth" },
        { name: "Leadership Development", description: "Skills for engineering managers", tag: "Advanced" },
        { name: "Public Speaking for Engineers", description: "Present your ideas with confidence", tag: "Skill" },
      ],
    },
    {
      title: "Community & Networking",
      description: "Connect with other Black women in engineering.",
      items: [
        { name: "Mentorship Programs", description: "Get matched with experienced engineers", tag: "Featured" },
        { name: "Networking Events Calendar", description: "Upcoming conferences and meetups", tag: "Updated" },
        { name: "Slack Community", description: "Join 10,000+ members in our Slack workspace", tag: "Free" },
        { name: "Local Chapters", description: "Find a BFE chapter near you", tag: "Community" },
        { name: "Book Club", description: "Monthly reads for engineers", tag: "New" },
        { name: "Study Groups", description: "Prepare for interviews together", tag: "Active" },
      ],
    },
  ];

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      "Popular": "bg-[#ffe500] text-black",
      "Free": "bg-green-100 text-green-800",
      "Essential": "bg-gray-100 text-gray-800",
      "Advanced": "bg-purple-100 text-purple-800",
      "Beginner": "bg-blue-100 text-blue-800",
      "In-Demand": "bg-[#ef562a]/10 text-[#ef562a]",
      "Trending": "bg-pink-100 text-pink-800",
      "Growth": "bg-teal-100 text-teal-800",
      "Skill": "bg-indigo-100 text-indigo-800",
      "Featured": "bg-[#ffe500] text-black",
      "Updated": "bg-orange-100 text-orange-800",
      "Community": "bg-amber-100 text-amber-800",
      "New": "bg-emerald-100 text-emerald-800",
      "Active": "bg-cyan-100 text-cyan-800",
    };
    return colors[tag] || "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40">
        {/* Hero */}
        <section className="bg-white pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                Free <span className="italic text-[#ef562a]">resources</span>
                <br />
                for your journey
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Everything you need to grow your skills, advance your career, and connect with the community.
              </p>
            </div>
          </div>
        </section>

        {/* Resource Categories */}
        {resourceCategories.map((category, categoryIndex) => (
          <section
            key={categoryIndex}
            className={categoryIndex % 2 === 0 ? "bg-gray-50 py-16 md:py-24" : "bg-white py-16 md:py-24"}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-12">
                <h2 className="font-serif text-3xl md:text-4xl">{category.title}</h2>
                <p className="mt-2 text-gray-600">{category.description}</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map((item, itemIndex) => (
                  <Link
                    key={itemIndex}
                    href="#"
                    className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#ffe500] hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTagColor(item.tag)}`}>
                        {item.tag}
                      </span>
                      <svg
                        className="w-5 h-5 text-gray-300 group-hover:text-[#ef562a] transition-colors"
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
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
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
              Have a resource to share?
            </h2>
            <p className="text-white/60 mb-8">
              Help grow our community by contributing valuable resources.
            </p>
            <Link
              href="/contact"
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

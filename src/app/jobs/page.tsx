import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import jobs from "@/data/jobs.json";
import deiCompanies from "@/data/dei-companies.json";

export const metadata = {
  title: "Job Board | The Black Female Engineer",
  description: "Find tech jobs and opportunities to accelerate your career in innovative industries.",
};

export default function JobsPage() {
  const categories = [
    "All Jobs",
    "Software Engineering",
    "Data Science",
    "Product Management",
    "DevOps / SRE",
    "Design",
  ];

  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40">
        {/* Hero */}
        <section className="bg-white pb-16 md:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                Find your <span className="italic text-[#ef562a]">next</span>
                <br />
                opportunity
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Explore roles at companies committed to diversity and inclusion in tech.
              </p>
            </div>

            {/* Categories */}
            <div className="mt-10 flex flex-wrap gap-3">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    index === 0
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section className="bg-gray-50 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              {jobs.map((job, index) => (
                <Link
                  key={index}
                  href={job.href || "#"}
                  target={job.href ? "_blank" : undefined}
                  rel={job.href ? "noopener noreferrer" : undefined}
                  className="block bg-white p-6 md:p-8 rounded-2xl hover:shadow-lg transition-shadow group"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[#ef562a] font-medium">{job.company}</span>
                        {job.remote && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            Remote
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-xl md:text-2xl group-hover:text-[#ef562a] transition-colors">
                        {job.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span>{job.location}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>{job.type}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>{job.posted}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-medium text-gray-900">{job.salary}</span>
                      <svg
                        className="w-6 h-6 text-gray-300 group-hover:text-[#ef562a] transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More */}
            <div className="mt-12 text-center">
              <button className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-colors">
                Load More Jobs
              </button>
            </div>
          </div>
        </section>

        {/* For Employers */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-sm tracking-widest text-gray-500">FOR EMPLOYERS</span>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mt-4">
                  Reach <span className="italic text-[#ef562a]">top</span> talent
                </h2>
                <p className="mt-4 text-gray-600 text-lg">
                  Post your openings and connect with 200K+ driven tech professionals ready to make an impact at your company.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/contact"
                    className="bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
                  >
                    Post a Job
                  </Link>
                  <Link
                    href="/contact"
                    className="border-2 border-gray-200 text-black px-8 py-4 rounded-full font-medium hover:border-gray-300 transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="bg-gray-100 rounded-3xl p-8 md:p-12">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ffe500] flex items-center justify-center flex-shrink-0">
                      <span className="font-serif font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Post your job</h4>
                      <p className="text-sm text-gray-600 mt-1">Share your opening with our community</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ffe500] flex items-center justify-center flex-shrink-0">
                      <span className="font-serif font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Reach qualified candidates</h4>
                      <p className="text-sm text-gray-600 mt-1">Connect with 200K+ tech professionals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ffe500] flex items-center justify-center flex-shrink-0">
                      <span className="font-serif font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Build a diverse team</h4>
                      <p className="text-sm text-gray-600 mt-1">Hire talent that drives innovation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Opportunities in your inbox
            </h2>
            <p className="text-white/60 mb-8">
              Get curated job opportunities and career advice delivered weekly.
            </p>
            <form className="flex max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-l-full focus:outline-none focus:border-white/40"
              />
              <button
                type="submit"
                className="bg-[#ffe500] text-black px-6 py-4 rounded-r-full font-medium hover:bg-[#f5dc00] transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

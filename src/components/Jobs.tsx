import Link from "next/link";

export default function Jobs() {
  const featuredJobs = [
    {
      company: "Google",
      title: "Senior Software Engineer",
      location: "Remote",
      type: "Full-time",
    },
    {
      company: "Microsoft",
      title: "Cloud Solutions Architect",
      location: "Seattle, WA",
      type: "Full-time",
    },
    {
      company: "Stripe",
      title: "Backend Engineer",
      location: "Remote",
      type: "Full-time",
    },
    {
      company: "Netflix",
      title: "Data Engineer",
      location: "Los Gatos, CA",
      type: "Full-time",
    },
    {
      company: "Apple",
      title: "iOS Developer",
      location: "Cupertino, CA",
      type: "Full-time",
    },
    {
      company: "Meta",
      title: "Product Manager",
      location: "Remote",
      type: "Full-time",
    },
  ];

  return (
    <section id="jobs" className="bg-gray-50 py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl">
            <span className="italic">find your</span> NEXT ROLE
          </h2>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Explore opportunities at companies committed to diversity and inclusion.
          </p>
        </div>

        {/* Jobs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredJobs.map((job, index) => (
            <Link
              key={index}
              href="#"
              className="bg-white p-6 rounded-2xl hover:shadow-lg transition-shadow group"
            >
              <span className="text-[#ef562a] text-sm font-medium">{job.company}</span>
              <h3 className="font-serif text-xl mt-2 group-hover:text-[#ef562a] transition-colors">
                {job.title}
              </h3>
              <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
                <span>{job.location}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>{job.type}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="#"
            className="inline-block bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            View All Jobs
          </Link>
        </div>

        {/* For Employers */}
        <div className="mt-20 text-center border-t border-gray-200 pt-12">
          <p className="text-sm tracking-wide mb-4">ARE YOU HIRING?</p>
          <Link
            href="#contact"
            className="inline-block border-2 border-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#ffe500] transition-colors"
          >
            Post a Job
          </Link>
        </div>
      </div>
    </section>
  );
}

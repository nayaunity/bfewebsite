"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useSubscribe } from "@/hooks/useSubscribe";
import { MicroWinsPreview } from "@/components/micro-wins/MicroWinsPreview";

export default function CommunityPage() {
  const [email, setEmail] = useState("");
  const { isLoading, isSuccess, error, message, subscribe } = useSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email, {
      tags: ["bfewebsite", "newsletter", "community-page"],
      onSuccess: () => setEmail(""),
    });
  };

  const communityMembers = [
    { name: "Software Engineers", role: "Building the future", company: "Big Tech" },
    { name: "Recent Graduates", role: "Breaking into tech", company: "Career Starters" },
    { name: "Tech Creatives", role: "Innovating daily", company: "Startups" },
    { name: "Data Scientists", role: "Driving insights", company: "Analytics" },
    { name: "Product Managers", role: "Leading products", company: "Tech Leaders" },
    { name: "Entrepreneurs", role: "Building businesses", company: "Founders" },
  ];

  const events = [
    { title: "Tech Talk: Breaking into Big Tech", date: "Jan 25, 2026", type: "Virtual" },
    { title: "Resume Review Workshop", date: "Feb 1, 2026", type: "Virtual" },
    { title: "NYC Meetup: Networking Night", date: "Feb 8, 2026", type: "In-Person" },
    { title: "Interview Prep Session", date: "Feb 15, 2026", type: "Virtual" },
  ];

  const contentThemes = [
    "Tech-Driven Innovation", "Career Strategies", "Entrepreneurship", "Financial Growth",
    "Practical Tools", "Sustainable Tech", "Work-Life Balance", "Personal Branding"
  ];

  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero */}
        <section className="bg-[var(--background)] pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                Join our <span className="italic text-[#ef562a]">thriving</span>
                <br />
                community
              </h1>
              <p className="mt-6 text-xl text-[var(--gray-600)]">
                Connect with 200K+ young professionals and tech enthusiasts who inspire, educate, and support each other.
              </p>
              <div className="mt-8">
                <Link
                  href="#join"
                  className="inline-block bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
                >
                  Join the Community
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-[var(--gray-50)] py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
              <div>
                <div className="font-serif text-4xl md:text-5xl text-[#ef562a]">200K+</div>
                <div className="mt-2 text-[var(--gray-600)]">Followers</div>
              </div>
              <div>
                <div className="font-serif text-4xl md:text-5xl text-[#ef562a]">63%</div>
                <div className="mt-2 text-[var(--gray-600)]">Women</div>
              </div>
              <div>
                <div className="font-serif text-4xl md:text-5xl text-[#ef562a]">67%</div>
                <div className="mt-2 text-[var(--gray-600)]">Ages 18-34</div>
              </div>
              <div>
                <div className="font-serif text-4xl md:text-5xl text-[#ef562a]">7.8%</div>
                <div className="mt-2 text-[var(--gray-600)]">Engagement</div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl">
                <span className="italic">what</span> WE OFFER
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ffe500] flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl mb-3">Tech &amp; Coding</h3>
                <p className="text-[var(--gray-600)]">
                  Hands-on projects, coding tutorials, and practical tech applications to level up your skills.
                </p>
              </div>
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ffe500] flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl mb-3">Career Growth</h3>
                <p className="text-[var(--gray-600)]">
                  Actionable advice on career strategies, personal branding, and breaking into your dream role.
                </p>
              </div>
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ffe500] flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl mb-3">Finance</h3>
                <p className="text-[var(--gray-600)]">
                  Financial growth strategies, salary negotiation tips, and building wealth in tech.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community Members */}
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl text-white">
                Who&apos;s in our community
              </h2>
              <div className="w-px h-8 bg-[#ffe500] mx-auto my-6"></div>
              <p className="text-white/60">
                Young professionals, tech enthusiasts, and the next generation of innovators
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {communityMembers.map((member, index) => (
                <div
                  key={index}
                  className="aspect-[4/5] bg-[var(--gray-800)] rounded-2xl overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <h4 className="font-serif text-lg md:text-xl text-white">{member.name}</h4>
                    <p className="text-white/60 text-sm mt-1">{member.role} at {member.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Micro-Wins Wall Preview */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
              <div>
                <span className="text-xs px-3 py-1 bg-[#ef562a] text-white rounded-full font-medium mb-4 inline-block">
                  New
                </span>
                <h2 className="font-serif text-3xl md:text-4xl">Micro-Wins Wall</h2>
                <p className="mt-2 text-[var(--gray-600)]">
                  Small wins, big impact. See what clicked for others.
                </p>
              </div>
              <Link
                href="/community/micro-wins"
                className="mt-4 md:mt-0 text-[#ef562a] font-medium hover:underline"
              >
                See all wins &rarr;
              </Link>
            </div>

            <MicroWinsPreview />
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl">Upcoming Events</h2>
                <p className="mt-2 text-[var(--gray-600)]">Join us at our next event</p>
              </div>
              <Link href="#" className="mt-4 md:mt-0 text-[#ef562a] font-medium hover:underline">
                View all events →
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {events.map((event, index) => (
                <Link
                  key={index}
                  href="#"
                  className="p-6 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-2xl hover:border-[#ffe500] transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        event.type === "Virtual" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}>
                        {event.type}
                      </span>
                      <h3 className="font-serif text-xl mt-3 group-hover:text-[#ef562a] transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-[var(--gray-600)] mt-2">{event.date}</p>
                    </div>
                    <svg
                      className="w-5 h-5 text-[var(--gray-200)] group-hover:text-[#ef562a] transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Content Themes */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl mb-4">Content that matters</h2>
            <p className="text-[var(--gray-600)] mb-12">Topics we cover to help you make an impact</p>

            <div className="flex flex-wrap justify-center gap-3">
              {contentThemes.map((theme, index) => (
                <span
                  key={index}
                  className="px-5 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-sm hover:border-[#ffe500] hover:bg-[#ffe500] hover:text-black transition-colors cursor-default"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Join CTA */}
        <section id="join" className="bg-[var(--cta-bg)] py-16 md:py-24 border-t border-[var(--card-border)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4 text-[var(--cta-text)]">
              Ready to level up?
            </h2>
            <p className="text-[var(--cta-text-muted)] mb-8 text-lg">
              Get actionable tech, career, and finance content delivered to your inbox.
            </p>
            {isSuccess ? (
              <div className="p-4 bg-[var(--card-bg)] text-[var(--foreground)] rounded-full max-w-md mx-auto text-center border border-[var(--card-border)]">
                {message}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                    className="flex-1 px-5 py-4 bg-[var(--card-bg)] text-[var(--foreground)] border-2 border-[var(--card-border)] rounded-l-full focus:outline-none focus:border-[var(--gray-600)] disabled:opacity-50 placeholder:text-[var(--gray-600)]"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#ffe500] text-black px-6 py-4 rounded-r-full font-medium hover:bg-[#f5dc00] transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "..." : "Join Us"}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

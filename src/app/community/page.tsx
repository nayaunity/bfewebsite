"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function CommunityPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter signup:", email);
    setEmail("");
    alert("Thanks for joining!");
  };

  const communityMembers = [
    { name: "Jasmine Williams", role: "Senior Software Engineer", company: "Meta" },
    { name: "Aisha Johnson", role: "Frontend Developer", company: "Shopify" },
    { name: "Destiny Brown", role: "DevOps Engineer", company: "AWS" },
    { name: "Keisha Thomas", role: "Data Scientist", company: "Netflix" },
    { name: "Maya Davis", role: "Product Manager", company: "Google" },
    { name: "Zara Mitchell", role: "ML Engineer", company: "OpenAI" },
  ];

  const events = [
    { title: "Tech Talk: Breaking into Big Tech", date: "Jan 25, 2026", type: "Virtual" },
    { title: "Resume Review Workshop", date: "Feb 1, 2026", type: "Virtual" },
    { title: "NYC Meetup: Networking Night", date: "Feb 8, 2026", type: "In-Person" },
    { title: "Interview Prep Session", date: "Feb 15, 2026", type: "Virtual" },
  ];

  const chapters = [
    "New York", "San Francisco", "Los Angeles", "Seattle", "Atlanta", "Chicago",
    "Austin", "Boston", "Washington DC", "Denver", "Toronto", "London"
  ];

  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40">
        {/* Hero */}
        <section className="bg-white pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                Join our <span className="italic text-[#ef562a]">thriving</span>
                <br />
                community
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Connect with 10,000+ Black women in engineering who support, inspire, and uplift each other.
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
        <section className="bg-gray-50 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
              <div>
                <div className="font-serif text-4xl md:text-5xl text-[#ef562a]">10K+</div>
                <div className="mt-2 text-gray-600">Members</div>
              </div>
              <div>
                <div className="font-serif text-4xl md:text-5xl text-[#ef562a]">12</div>
                <div className="mt-2 text-gray-600">City Chapters</div>
              </div>
              <div>
                <div className="font-serif text-4xl md:text-5xl text-[#ef562a]">50+</div>
                <div className="mt-2 text-gray-600">Events/Year</div>
              </div>
              <div>
                <div className="font-serif text-4xl md:text-5xl text-[#ef562a]">95%</div>
                <div className="mt-2 text-gray-600">Satisfaction</div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="bg-white py-16 md:py-24">
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl mb-3">Slack Community</h3>
                <p className="text-gray-600">
                  Join our active Slack workspace with channels for job hunting, technical help, career advice, and more.
                </p>
              </div>
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ffe500] flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl mb-3">Mentorship</h3>
                <p className="text-gray-600">
                  Get matched with experienced engineers who can guide you through your career journey.
                </p>
              </div>
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ffe500] flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl mb-3">Events</h3>
                <p className="text-gray-600">
                  Attend virtual and in-person events including workshops, networking nights, and tech talks.
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
                Meet our members
              </h2>
              <div className="w-px h-8 bg-[#ffe500] mx-auto my-6"></div>
              <p className="text-white/60">
                Engineers, creators, leaders, and innovators
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {communityMembers.map((member, index) => (
                <div
                  key={index}
                  className="aspect-[4/5] bg-gray-800 rounded-2xl overflow-hidden relative group"
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

        {/* Upcoming Events */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl">Upcoming Events</h2>
                <p className="mt-2 text-gray-600">Join us at our next event</p>
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
                  className="p-6 border border-gray-200 rounded-2xl hover:border-[#ffe500] transition-colors group"
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
                      <p className="text-gray-500 mt-2">{event.date}</p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-300 group-hover:text-[#ef562a] transition-colors"
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

        {/* Chapters */}
        <section className="bg-gray-50 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl mb-4">Find a chapter near you</h2>
            <p className="text-gray-600 mb-12">Connect with members in your city</p>

            <div className="flex flex-wrap justify-center gap-3">
              {chapters.map((chapter, index) => (
                <Link
                  key={index}
                  href="#"
                  className="px-5 py-2 bg-white border border-gray-200 rounded-full text-sm hover:border-[#ffe500] hover:bg-[#ffe500] transition-colors"
                >
                  {chapter}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Join CTA */}
        <section id="join" className="bg-[#ffe500] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4">
              Ready to join?
            </h2>
            <p className="text-black/70 mb-8 text-lg">
              Sign up for our newsletter and get access to the Slack community.
            </p>
            <form onSubmit={handleSubmit} className="flex max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-5 py-4 bg-white border-2 border-black/10 rounded-l-full focus:outline-none focus:border-black/20"
              />
              <button
                type="submit"
                className="bg-black text-white px-6 py-4 rounded-r-full font-medium hover:bg-gray-800 transition-colors"
              >
                Join Us
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

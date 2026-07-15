import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "About | The Black Female Engineer",
  description: "Helping 250K+ people build skills, wealth, and freedom with AI.",
  openGraph: {
    title: "About | The Black Female Engineer",
    description: "Helping 250K+ people build skills, wealth, and freedom with AI.",
    url: "/about",
    type: "website",
    images: [{ url: "/images/bfeimage2.png", alt: "The Black Female Engineer" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "About | The Black Female Engineer",
    description: "Helping 250K+ people build skills, wealth, and freedom with AI.",
    images: ["/images/bfeimage2.png"],
  },
};

export default function AboutPage() {
  const values = [
    {
      title: "Accessibility",
      description: "Making AI and technology understandable and actionable for everyone.",
    },
    {
      title: "Authenticity",
      description: "Blending genuine storytelling with strategic, valuable insights.",
    },
    {
      title: "Empowerment",
      description: "Equipping people with tools and strategies to build wealth and freedom.",
    },
    {
      title: "Freedom",
      description: "Helping you build a life on your own terms through skills and income.",
    },
  ];

  const timeline = [
    { year: "2020", event: "Pivoted to software engineering after earning my degree in Finance" },
    { year: "2021", event: "Started creating content to make tech accessible during the pandemic" },
    { year: "2022", event: "Expanded to TikTok and Instagram with career and coding content, reaching 50,000+ members across socials" },
    // { year: "2023", event: "Grew community to 100K+ tech enthusiasts" },
    // { year: "2024", event: "Partnered with major tech companies and brands to teach new and emerging technologies and how to adopt them" },
    { year: "2025", event: "Reached 250K+ followers helping people build skills, wealth, and freedom with AI" },
    { year: "2026", event: "Enabled thousands of people to grow their skills, earn more, and build momentum through a centralized platform" },
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
                Building <span className="italic text-[var(--accent)]">skills</span>,
                <br />
                wealth, and freedom
              </h1>
              <p className="mt-6 text-xl text-[var(--gray-600)]">
                I created the Black Female Engineer 5+ years ago to help people use AI and technology to level up their skills, earn more, and build a life on their own terms.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-[#2a2828] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white">
              My Mission
            </h2>
            <div className="w-px h-12 bg-[#4d1b27] mx-auto my-8"></div>
            <p className="text-xl md:text-2xl text-white/80 font-serif italic">
              To equip you with the tools and strategies to build skills, grow your income, and create freedom with AI.
            </p>
          </div>
        </section>

        {/* What I Believe */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl">
                  <span className="italic">what I</span> BELIEVE IN
                </h2>
                <p className="mt-6 text-[var(--gray-600)] text-lg leading-relaxed">
                  People everywhere are ready to use AI to change their careers, grow their income, and take control of their time. They need clear, practical guidance on how to actually do it.
                </p>
                <p className="mt-4 text-[var(--gray-600)] text-lg leading-relaxed">
                  I believe in inspiring, educating, and entertaining through relatable storytelling, valuable resources, and real strategies. I believe in empowering underrepresented communities and helping the next generation build on their own terms.
                </p>
              </div>
              <div className="relative rounded-3xl aspect-square overflow-hidden">
                <Image
                  src="/images/nyaradzo.jpg"
                  alt="Nyaradzo"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl">
                <span className="italic">my</span> VALUES
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-[var(--card-bg)] p-8 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-[#4d1b27] flex items-center justify-center mb-6">
                    <span className="font-serif font-bold text-lg text-black">{index + 1}</span>
                  </div>
                  <h3 className="font-serif text-xl mb-3">{value.title}</h3>
                  <p className="text-[var(--gray-600)]">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl">
                <span className="italic">my</span> JOURNEY
              </h2>
            </div>

            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="w-20 flex-shrink-0">
                    <span className="font-serif text-2xl text-[var(--accent)]">{item.year}</span>
                  </div>
                  <div className="flex-1 pb-8 border-l-2 border-[var(--card-border)] pl-6 relative">
                    <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-[#4d1b27]"></div>
                    <p className="text-[var(--gray-600)]">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm tracking-widest mb-8">I&apos;VE PARTNERED WITH</p>
              <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 font-serif text-2xl md:text-4xl text-[var(--gray-400)]">
                <span>AMAZON</span>
                <span className="text-[var(--accent)]">MICROSOFT</span>
                <span>ADOBE</span>
                <span className="text-[var(--accent)]">LINKEDIN</span>
                <span>HP</span>
                <span className="text-[var(--accent)]">ANTHROPIC</span>
              </div>
            </div>
            <p className="text-center text-sm">
              WANT TO PARTNER?{" "}
              <Link href="/contact" className="underline hover:text-[var(--accent)]">
                LET ME KNOW
              </Link>
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--cta-bg)] py-16 md:py-24 border-t border-[var(--card-border)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4 text-[var(--cta-text)]">
              Join the community
            </h2>
            <p className="text-[var(--cta-text-muted)] mb-8 text-lg">
              Get the tools and strategies to build your edge with AI.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/community"
                className="bg-[#4d1b27] text-white px-8 py-4 rounded-full font-medium hover:bg-[#4d383b] transition-colors"
              >
                Join the Community
              </Link>
              <Link
                href="/resources"
                className="bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--card-border)] px-8 py-4 rounded-full font-medium hover:border-[var(--accent)] transition-colors"
              >
                Explore Resources
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

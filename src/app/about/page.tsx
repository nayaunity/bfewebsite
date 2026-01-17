import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "About | The Black Female Engineer",
  description: "Making technology accessible and actionable for young professionals and tech-minded creatives.",
};

export default function AboutPage() {
  const values = [
    {
      title: "Accessibility",
      description: "Making technology understandable and actionable for everyone.",
    },
    {
      title: "Authenticity",
      description: "Blending genuine storytelling with strategic, valuable insights.",
    },
    {
      title: "Empowerment",
      description: "Equipping audiences with tools and inspiration to make an impact.",
    },
    {
      title: "Innovation",
      description: "Bridging the gap between cutting-edge tech and everyday life.",
    },
  ];

  const timeline = [
    { year: "2020", event: "Started creating content to make tech accessible during the pandemic" },
    { year: "2021", event: "Reached 10,000 followers across social platforms" },
    { year: "2022", event: "Expanded to TikTok and YouTube with career and coding content" },
    { year: "2023", event: "Grew community to 100K+ tech enthusiasts" },
    { year: "2024", event: "Partnered with major tech companies and brands" },
    { year: "2025", event: "Reached 200K+ followers empowering the next generation of innovators" },
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
                Bridging <span className="italic text-[#ef562a]">innovation</span>
                <br />
                and everyday life
              </h1>
              <p className="mt-6 text-xl text-[var(--gray-600)]">
                The Black Female Engineer is dedicated to making technology accessible and actionable, particularly for young professionals and tech-minded creatives.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white">
              Our Mission
            </h2>
            <div className="w-px h-12 bg-[#ffe500] mx-auto my-8"></div>
            <p className="text-xl md:text-2xl text-white/80 font-serif italic">
              To equip audiences with the tools and inspiration needed to make an impact—whether they&apos;re developing the next big app or breaking into their dream career.
            </p>
          </div>
        </section>

        {/* What We Believe */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl">
                  <span className="italic">what we</span> BELIEVE IN
                </h2>
                <p className="mt-6 text-[var(--gray-600)] text-lg leading-relaxed">
                  Young professionals and tech enthusiasts are eager to make their mark in tech and corporate. These driven individuals are looking for actionable advice on career growth, hands-on projects, and practical tech applications within everyday life.
                </p>
                <p className="mt-4 text-[var(--gray-600)] text-lg leading-relaxed">
                  We believe in inspiring, educating, and entertaining through relatable storytelling, valuable resources, and thought-provoking discussions. We believe in empowering underrepresented communities in tech and inspiring the next generation of innovators.
                </p>
              </div>
              <div className="bg-[var(--gray-100)] rounded-3xl aspect-square flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#ffe500] flex items-center justify-center">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <p className="text-[var(--gray-600)] text-sm">Add team photo here</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl">
                <span className="italic">our</span> VALUES
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-[var(--card-bg)] p-8 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-[#ffe500] flex items-center justify-center mb-6">
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
                <span className="italic">our</span> JOURNEY
              </h2>
            </div>

            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="w-20 flex-shrink-0">
                    <span className="font-serif text-2xl text-[#ef562a]">{item.year}</span>
                  </div>
                  <div className="flex-1 pb-8 border-l-2 border-[var(--card-border)] pl-6 relative">
                    <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-[#ffe500]"></div>
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
              <p className="text-sm tracking-widest mb-8">WE&apos;VE PARTNERED WITH</p>
              <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 font-serif text-2xl md:text-4xl text-[var(--gray-200)]">
                <span>AMAZON</span>
                <span className="text-[#ef562a]">MICROSOFT</span>
                <span>ADOBE</span>
                <span className="text-[#ef562a]">LINKEDIN</span>
                <span>HP</span>
                <span className="text-[#ef562a]">ANTHROPIC</span>
              </div>
            </div>
            <p className="text-center text-sm">
              WANT TO PARTNER WITH US?{" "}
              <Link href="/contact" className="underline hover:text-[#ef562a]">
                LET US KNOW
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
              Get the tools and inspiration to make your impact in tech.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/community"
                className="bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
              >
                Join the Community
              </Link>
              <Link
                href="/resources"
                className="bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--card-border)] px-8 py-4 rounded-full font-medium hover:border-[#ffe500] transition-colors"
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

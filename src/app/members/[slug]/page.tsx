import Link from "next/link";
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { getMemberBySlug, getAllMemberSlugs, communityMembers } from "@/data/communityMembers";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllMemberSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const member = getMemberBySlug(slug);

  if (!member) {
    return {
      title: "Member Not Found | The Black Female Engineer",
    };
  }

  return {
    title: `${member.name} | The Black Female Engineer`,
    description: member.bio,
  };
}

export default async function MemberPage({ params }: PageProps) {
  const { slug } = await params;
  const member = getMemberBySlug(slug);

  if (!member) {
    notFound();
  }

  // Get other members for the "More Community Members" section
  const otherMembers = communityMembers.filter(m => m.slug !== slug).slice(0, 3);

  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero Section */}
        <section className="bg-[var(--background)] pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
              {/* Left: Photo placeholder */}
              <div className="aspect-[4/5] bg-[var(--gray-800)] rounded-3xl overflow-hidden relative">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#ffe500] flex items-center justify-center">
                        <span className="font-serif text-4xl text-black">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <p className="text-white/40 text-sm">Photo coming soon</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Info */}
              <div>
                <Link
                  href="/#community"
                  className="inline-flex items-center text-sm text-[var(--gray-600)] hover:text-[#ef562a] mb-6 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Community
                </Link>

                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight">
                  {member.name}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-lg">
                  <span className="text-[#ef562a]">{member.role}</span>
                  <span className="text-[var(--gray-400)]">at</span>
                  <span>{member.company}</span>
                </div>

                <div className="mt-6 inline-block bg-[#ffe500] text-black px-4 py-2 rounded-full text-sm font-medium">
                  {member.specialty}
                </div>

                <p className="mt-8 text-xl text-[var(--gray-600)] font-serif italic">
                  {member.bio}
                </p>

                {/* Social Links */}
                {(member.linkedinUrl || member.twitterUrl || member.websiteUrl) && (
                  <div className="mt-8 flex gap-4">
                    {member.linkedinUrl && (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full bg-[var(--gray-100)] flex items-center justify-center hover:bg-[#ffe500] transition-colors"
                        aria-label="LinkedIn"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                    {member.twitterUrl && (
                      <a
                        href={member.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full bg-[var(--gray-100)] flex items-center justify-center hover:bg-[#ffe500] transition-colors"
                        aria-label="Twitter"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                    {member.websiteUrl && (
                      <a
                        href={member.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full bg-[var(--gray-100)] flex items-center justify-center hover:bg-[#ffe500] transition-colors"
                        aria-label="Website"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}

                {/* Summary */}
                <p className="mt-8 text-[var(--gray-600)] leading-relaxed">
                  {member.summary}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl md:text-4xl text-white text-center">
              My Story
            </h2>
            <div className="w-px h-12 bg-[#ffe500] mx-auto my-8"></div>
            <div className="space-y-6">
              {member.story.map((paragraph, index) => (
                <p key={index} className="text-xl md:text-2xl text-white/80 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
              <span className="italic">my</span> EXPERIENCE
            </h2>

            <div className="space-y-6">
              {member.experience.map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg text-[var(--gray-600)]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
              <span className="italic">my</span> SKILLS
            </h2>

            <div className="flex flex-wrap justify-center gap-4">
              {member.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] px-6 py-3 rounded-full text-lg hover:border-[#ffe500] transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Other Members Section */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
              <span className="italic">more</span> COMMUNITY MEMBERS
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {otherMembers.map((otherMember) => (
                <Link
                  key={otherMember.id}
                  href={`/members/${otherMember.slug}`}
                  className="group aspect-[4/5] bg-[var(--gray-800)] rounded-2xl overflow-hidden relative"
                >
                  {otherMember.image ? (
                    <img
                      src={otherMember.image}
                      alt={otherMember.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-[#ffe500]/20 flex items-center justify-center">
                        <span className="font-serif text-3xl text-white/60">
                          {otherMember.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <h4 className="font-serif text-lg md:text-xl text-white group-hover:text-[#ffe500] transition-colors">
                      {otherMember.name}
                    </h4>
                    <p className="text-white/60 text-sm mt-1">
                      {otherMember.role} at {otherMember.company}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--cta-bg)] py-16 md:py-24 border-t border-[var(--card-border)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4 text-[var(--cta-text)]">
              Join the community
            </h2>
            <p className="text-[var(--cta-text-muted)] mb-8 text-lg">
              Connect with amazing engineers and grow your career.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/community"
                className="bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
              >
                Join the Community
              </Link>
              <Link
                href="/#community"
                className="bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--card-border)] px-8 py-4 rounded-full font-medium hover:border-[#ffe500] transition-colors"
              >
                Meet More Members
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

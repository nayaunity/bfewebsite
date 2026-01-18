import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Work With Us | The Black Female Engineer",
  description: "Partner with The Black Female Engineer for AI training, job board advertising, sponsored content, and corporate workshops.",
};

export default function WorkWithUsPage() {
  const services = [
    {
      title: "AI Training for Teams",
      description: "Equip your team with practical AI skills they can use immediately. From prompt engineering to building AI-powered workflows, I deliver hands-on training that transforms how teams work.",
      features: [
        "Custom curriculum tailored to your industry",
        "Hands-on workshops with real-world applications",
        "Follow-up resources and implementation guides",
        "Virtual or in-person delivery options",
      ],
      cta: "Book a Training",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </svg>
      ),
    },
    {
      title: "Job Board Advertising",
      description: "Reach 200K+ engaged tech professionals actively looking for their next opportunity. Our audience includes software engineers, data scientists, product managers, and more.",
      features: [
        "Featured job listings with premium placement",
        "Newsletter inclusion to 50K+ subscribers",
        "Social media amplification across platforms",
        "Detailed analytics on job post performance",
      ],
      cta: "Post a Job",
      href: "/jobs/submit",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
        </svg>
      ),
    },
    {
      title: "Sponsored Content",
      description: "Authentic brand partnerships that resonate with our community. I create engaging content that introduces your product or service to an audience that trusts my recommendations.",
      features: [
        "Instagram posts and stories",
        "TikTok and YouTube content",
        "Newsletter sponsorships",
        "Podcast appearances and features",
      ],
      cta: "Discuss Partnership",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      ),
    },
    {
      title: "Speaking Engagements",
      description: "Inspire your audience with talks on AI adoption, career development in tech, and building inclusive tech cultures. Available for conferences, corporate events, and panels.",
      features: [
        "Keynotes on AI and emerging technology",
        "Career development workshops",
        "Panel discussions and fireside chats",
        "Custom presentations for your audience",
      ],
      cta: "Book a Speaker",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      ),
    },
  ];

  const stats = [
    { number: "200K+", label: "Community Members" },
    { number: "50K+", label: "Newsletter Subscribers" },
    { number: "10M+", label: "Content Views" },
    { number: "100+", label: "Brand Partnerships" },
  ];

  const pastPartners = [
    "Amazon",
    "Microsoft",
    "Adobe",
    "LinkedIn",
    "HP",
    "Anthropic",
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
                Let&apos;s <span className="italic text-[#ef562a]">work</span>
                <br />
                together
              </h1>
              <p className="mt-6 text-xl text-[var(--gray-600)]">
                Partner with a trusted voice in tech to reach engaged professionals, train your teams on AI, or amplify your employer brand to the next generation of talent.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-[#1a1a1a] py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="font-serif text-4xl md:text-5xl text-[#ffe500] mb-2">
                    {stat.number}
                  </div>
                  <div className="text-white/60 text-sm tracking-wide">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl">
                <span className="italic">how we can</span> WORK TOGETHER
              </h2>
              <p className="mt-4 text-[var(--gray-600)] max-w-2xl mx-auto">
                Whether you&apos;re looking to upskill your team, hire diverse talent, or reach an engaged tech audience, I have solutions tailored for your business.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 hover:border-[#ffe500] transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-[#ffe500] flex items-center justify-center mb-6 text-black">
                    {service.icon}
                  </div>
                  <h3 className="font-serif text-2xl mb-3">{service.title}</h3>
                  <p className="text-[var(--gray-600)] mb-6">{service.description}</p>
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#ef562a] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[var(--gray-600)]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {service.href ? (
                    <Link
                      href={service.href}
                      className="inline-flex items-center gap-2 bg-[#ffe500] text-black px-6 py-3 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
                    >
                      {service.cta}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  ) : (
                    <a
                      href="mailto:hello@bfepartnerships.com"
                      className="inline-flex items-center gap-2 bg-[#ffe500] text-black px-6 py-3 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
                    >
                      {service.cta}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Past Partners */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm tracking-widest mb-8">TRUSTED BY LEADING COMPANIES</p>
              <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 font-serif text-2xl md:text-4xl text-[var(--gray-400)]">
                {pastPartners.map((partner, index) => (
                  <span key={partner} className={index % 2 === 1 ? "text-[#ef562a]" : ""}>
                    {partner.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Partner */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl">
                  <span className="italic">why</span> PARTNER WITH ME
                </h2>
                <div className="mt-8 space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ffe500] flex items-center justify-center flex-shrink-0">
                      <span className="font-serif font-bold text-black">1</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-1">Authentic Engagement</h3>
                      <p className="text-[var(--gray-600)]">
                        My community trusts my recommendations because I only partner with brands and products I genuinely believe in.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ffe500] flex items-center justify-center flex-shrink-0">
                      <span className="font-serif font-bold text-black">2</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-1">Diverse Talent Pipeline</h3>
                      <p className="text-[var(--gray-600)]">
                        Access a highly engaged audience of underrepresented professionals in tech who are actively growing their careers.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ffe500] flex items-center justify-center flex-shrink-0">
                      <span className="font-serif font-bold text-black">3</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-1">Proven Results</h3>
                      <p className="text-[var(--gray-600)]">
                        Track record of successful partnerships with Fortune 500 companies and leading tech startups alike.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--gray-100)] rounded-3xl aspect-square flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#ef562a] flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  </div>
                  <p className="text-[var(--gray-600)] text-sm">B2B partnerships</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--cta-bg)] py-16 md:py-24 border-t border-[var(--card-border)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4 text-[var(--cta-text)]">
              Ready to get started?
            </h2>
            <p className="text-[var(--cta-text-muted)] mb-8 text-lg">
              Let&apos;s discuss how we can work together to achieve your goals.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:hello@bfepartnerships.com"
                className="bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
              >
                Get in Touch
              </a>
              <Link
                href="/jobs/submit"
                className="bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--card-border)] px-8 py-4 rounded-full font-medium hover:border-[#ffe500] transition-colors"
              >
                Post a Job
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

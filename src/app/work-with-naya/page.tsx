import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import PageViewTracker from "./PageViewTracker";

export const metadata = {
  title: "Companies & Creators | The Black Female Engineer",
  description:
    "Speaking engagements, brand partnerships, and private creator CEO partnerships with Naya.",
  openGraph: {
    title: "Companies & Creators | The Black Female Engineer",
    description:
      "Speaking engagements, brand partnerships, and private creator CEO partnerships with Naya.",
    url: "/work-with-naya",
    type: "website",
    images: [{ url: "/images/bfeimage2.png", alt: "The Black Female Engineer" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Companies & Creators | The Black Female Engineer",
    description:
      "Speaking engagements, brand partnerships, and private creator CEO partnerships with Naya.",
    images: ["/images/bfeimage2.png"],
  },
};

export default function WorkWithNayaPage() {
  return (
    <>
      <Navigation />
      <PagePresenceTracker page="work-with-naya" />
      <PageViewTracker />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero */}
        <section className="pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                Companies &{" "}
                <span className="italic text-[var(--accent)]">Creators</span>
              </h1>
              <p className="mt-6 text-xl text-[var(--gray-600)]">
                There are different ways to work together depending on who you are and
                what you need.
              </p>
            </div>
          </div>
        </section>

        {/* ── COMPANIES ── */}
        <section className="pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm tracking-widest text-[var(--gray-600)] mb-8">
              FOR COMPANIES
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Brand Partnerships */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 md:p-10 flex flex-col">
                <h2 className="font-serif text-3xl md:text-4xl mb-4">
                  Brand Partnerships
                </h2>
                <p className="text-[var(--gray-600)] mb-8 text-lg leading-relaxed">
                  For companies looking to educate millions about AI through trusted
                  creator-led campaigns.
                </p>
                <div className="mt-auto">
                  <a
                    href="mailto:naya@bfepartnerships.com?subject=Brand%20Partnership%20Inquiry"
                    className="inline-flex items-center gap-2 bg-[var(--accent)] text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
                  >
                    Start a Conversation
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Speaking */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 md:p-10 flex flex-col">
                <h2 className="font-serif text-3xl md:text-4xl mb-4">Speaking</h2>
                <p className="font-serif text-2xl mb-4">Starting at $25,000</p>
                <ul className="space-y-3 mb-8 text-[var(--gray-600)]">
                  <li>Keynotes</li>
                  <li>Executive workshops</li>
                  <li>Conferences</li>
                </ul>
                <div className="mt-auto">
                  <a
                    href="mailto:naya@bfepartnerships.com?subject=Speaking%20Inquiry"
                    className="inline-flex items-center gap-2 bg-[var(--accent)] text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
                  >
                    Discuss a Partnership
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <hr className="border-[var(--card-border)]" />
        </div>

        {/* ── CREATORS ── */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm tracking-widest text-[var(--gray-600)] mb-8">
              FOR CREATORS
            </p>

            {/* Creator CEO card */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 md:p-10 lg:p-12">
              <div className="grid md:grid-cols-2 gap-12 md:gap-16">
                {/* Left: Who & What */}
                <div>
                  <h2 className="font-serif text-3xl md:text-4xl mb-2">
                    Creator CEO{" "}
                    <span className="italic text-[var(--accent)]">Partnership</span>
                  </h2>
                  <p className="text-[var(--gray-600)] mb-10">
                    Private. Two partnerships annually.
                  </p>

                  <div className="mb-10">
                    <h3 className="text-sm tracking-widest text-[var(--gray-600)] mb-4">
                      WHO IT&apos;S FOR
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Established creators with significant audiences",
                        "Founders building products, communities, or software",
                        "CEOs who want AI to become a competitive advantage",
                        "Creators scaling teams and seven-figure businesses",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <svg
                            className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm tracking-widest text-[var(--gray-600)] mb-4">
                      WHAT WE WORK ON
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Business strategy",
                        "AI systems & automation",
                        "Monetization",
                        "Hiring & delegation",
                        "Brand negotiations",
                        "Product strategy",
                        "CEO decision-making",
                      ].map((tag) => (
                        <span
                          key={tag}
                          className="bg-[var(--gray-50)] border border-[var(--card-border)] text-sm px-4 py-2 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Availability, Investment, CTA */}
                <div className="flex flex-col justify-center">
                  <div className="bg-[var(--gray-50)] rounded-2xl p-8 md:p-10">
                    <div className="mb-8">
                      <h3 className="text-sm tracking-widest text-[var(--gray-600)] mb-3">
                        AVAILABILITY
                      </h3>
                      <p className="text-lg leading-relaxed">
                        I work privately with no more than two creators each year to
                        ensure every partnership receives my full attention.
                      </p>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-sm tracking-widest text-[var(--gray-600)] mb-3">
                        INVESTMENT
                      </h3>
                      <p className="font-serif text-3xl md:text-4xl">
                        Starting at $250,000
                        <span className="text-[var(--gray-600)] text-lg">/year</span>
                      </p>
                    </div>

                    <a
                      href="mailto:naya@bfepartnerships.com?subject=Creator%20CEO%20Partnership"
                      className="inline-flex items-center gap-2 bg-[var(--accent)] text-white px-8 py-4 rounded-full font-medium hover:opacity-90 transition-opacity text-lg w-full justify-center"
                    >
                      Start a Conversation
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </a>

                    <p className="text-sm text-[var(--gray-600)] mt-6 leading-relaxed">
                      If you&apos;re looking for content coaching, this isn&apos;t the
                      right fit. This partnership is designed for established creators
                      who are building enduring businesses beyond their audience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Past Partners */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm tracking-widest text-[var(--gray-600)] mb-8">
                TRUSTED BY LEADING COMPANIES
              </p>
              <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 font-serif text-2xl md:text-4xl text-[var(--gray-400)]">
                {["Amazon", "Microsoft", "Adobe", "LinkedIn", "HP", "Anthropic"].map(
                  (partner, index) => (
                    <span
                      key={partner}
                      className={index % 2 === 1 ? "text-[var(--accent)]" : ""}
                    >
                      {partner.toUpperCase()}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

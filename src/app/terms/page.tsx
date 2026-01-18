import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service | The Black Female Engineer",
  description: "Terms of Service for The Black Female Engineer platform.",
};

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        <section className="pb-16 md:pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-serif text-4xl md:text-5xl mb-4">Terms of Service</h1>
            <p className="text-[var(--gray-600)] mb-12">Last updated: January 2026</p>

            <div className="prose prose-lg max-w-none space-y-8">
              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">Agreement to Terms</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  By accessing or using The Black Female Engineer website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">Description of Services</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  The Black Female Engineer provides educational resources, career guidance, job listings, and community features for individuals interested in technology and professional development. Our services include online courses, articles, a job board, and community forums.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">User Accounts</h2>
                <p className="text-[var(--gray-600)] leading-relaxed mb-4">
                  Some features of our platform require you to create an account. When creating an account, you agree to:
                </p>
                <ul className="list-disc pl-6 text-[var(--gray-600)] space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Be responsible for all activities under your account</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">Acceptable Use</h2>
                <p className="text-[var(--gray-600)] leading-relaxed mb-4">
                  You agree not to use our platform to:
                </p>
                <ul className="list-disc pl-6 text-[var(--gray-600)] space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Post false, misleading, or inappropriate content</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with the proper functioning of the platform</li>
                  <li>Scrape, copy, or redistribute our content without permission</li>
                  <li>Use automated systems to access the platform without our consent</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">Intellectual Property</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  All content on The Black Female Engineer, including text, graphics, logos, images, videos, and course materials, is owned by us or our content creators and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">User Content</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  When you submit content to our platform (such as micro-wins, comments, or forum posts), you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content in connection with our services. You retain ownership of your content and are responsible for ensuring it does not violate any third-party rights.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">Job Board</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  Our job board aggregates listings from third-party employers. We do not guarantee the accuracy of job listings or the legitimacy of employers. We are not responsible for any interactions between you and potential employers, including hiring decisions, employment terms, or disputes.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">Disclaimer of Warranties</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  Our platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. We do not guarantee that our services will be uninterrupted, error-free, or secure. Educational content is provided for informational purposes and should not be considered professional advice.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">Limitation of Liability</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  To the maximum extent permitted by law, The Black Female Engineer shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our platform, including but not limited to loss of data, profits, or opportunities.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">Indemnification</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  You agree to indemnify and hold harmless The Black Female Engineer and its owners, employees, and partners from any claims, damages, or expenses arising from your use of our platform or violation of these terms.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">Termination</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  We reserve the right to suspend or terminate your account and access to our services at any time, with or without cause, and with or without notice. Upon termination, your right to use our platform will immediately cease.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">Changes to Terms</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  We may modify these terms at any time. We will notify users of significant changes by posting a notice on our platform. Your continued use of our services after changes are posted constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">Governing Law</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  These terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4 text-[var(--foreground)]">Contact Us</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at{" "}
                  <a href="mailto:hello@theblackfemaleengineer.com" className="text-[#ef562a] hover:underline">
                    hello@theblackfemaleengineer.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

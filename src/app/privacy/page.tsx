import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | The Black Female Engineer",
  description: "Privacy Policy for The Black Female Engineer platform.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        <section className="pb-16 md:pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-serif text-4xl md:text-5xl mb-4">Privacy Policy</h1>
            <p className="text-[var(--gray-600)] mb-12">Last updated: January 2026</p>

            <div className="prose prose-lg max-w-none space-y-8">
              <section>
                <h2 className="font-serif text-2xl mb-4">Introduction</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  The Black Female Engineer (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website and use our services.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4">Information We Collect</h2>
                <p className="text-[var(--gray-600)] leading-relaxed mb-4">
                  We may collect the following types of information:
                </p>
                <ul className="list-disc pl-6 text-[var(--gray-600)] space-y-2">
                  <li><strong>Account Information:</strong> When you sign up, we collect your email address and display name.</li>
                  <li><strong>Usage Data:</strong> We collect information about how you interact with our platform, including pages visited, lessons completed, and features used.</li>
                  <li><strong>Analytics Data:</strong> We use analytics tools to understand how our platform is used and to improve our services.</li>
                  <li><strong>Communications:</strong> If you contact us or subscribe to our newsletter, we collect the information you provide.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4">How We Use Your Information</h2>
                <p className="text-[var(--gray-600)] leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-[var(--gray-600)] space-y-2">
                  <li>Provide and maintain our services</li>
                  <li>Track your progress through courses and lessons</li>
                  <li>Send you updates, newsletters, and relevant content (with your consent)</li>
                  <li>Improve and personalize your experience</li>
                  <li>Analyze usage patterns to enhance our platform</li>
                  <li>Respond to your inquiries and provide support</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4">Data Sharing</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  We do not sell your personal information. We may share your data with trusted third-party service providers who assist us in operating our platform (such as hosting, analytics, and email services). These providers are bound by confidentiality agreements and may only use your data to provide services to us.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4">Cookies and Tracking</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  We use cookies and similar technologies to enhance your experience, remember your preferences, and analyze how our platform is used. You can manage your cookie preferences through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4">Data Security</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4">Your Rights</h2>
                <p className="text-[var(--gray-600)] leading-relaxed mb-4">
                  Depending on your location, you may have the following rights:
                </p>
                <ul className="list-disc pl-6 text-[var(--gray-600)] space-y-2">
                  <li>Access and receive a copy of your personal data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt out of marketing communications</li>
                  <li>Withdraw consent where applicable</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4">Third-Party Links</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  Our platform may contain links to third-party websites, including job listings and external resources. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4">Changes to This Policy</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-4">Contact Us</h2>
                <p className="text-[var(--gray-600)] leading-relaxed">
                  If you have any questions about this privacy policy or our data practices, please contact us at{" "}
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

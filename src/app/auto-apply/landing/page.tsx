import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import LandingHero from "@/components/landing/LandingHero";
import CompanyCloud from "@/components/landing/CompanyCloud";
import CompanyShowcase from "@/components/landing/CompanyShowcase";
import ValueProp from "@/components/landing/ValueProp";
import HowItWorks from "@/components/landing/HowItWorks";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTA from "@/components/landing/FinalCTA";

export const metadata = {
  title: "Auto-Apply to Top Tech Jobs — The Black Female Engineer",
  description:
    "BFE finds and applies you to the best new jobs every day. Apply to Stripe, Airbnb, Figma, Anthropic, and 17+ more top companies on autopilot.",
};

export default function LandingPage() {
  return (
    <>
      <PagePresenceTracker page="landing" />
      <Navigation />
      <main>
        <LandingHero />
        <CompanyCloud />
        <CompanyShowcase />
        <ValueProp />
        <HowItWorks />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

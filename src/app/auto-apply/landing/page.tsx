import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import LandingNav from "@/components/landing/editorial/LandingNav";
import HeroSection from "@/components/landing/editorial/HeroSection";
import CompanyMarquee from "@/components/landing/editorial/CompanyMarquee";
import HowItWorksEditorial from "@/components/landing/editorial/HowItWorksEditorial";
import PullQuote from "@/components/landing/editorial/PullQuote";
import ComparisonTable from "@/components/landing/editorial/ComparisonTable";
import PricingSection from "@/components/landing/editorial/PricingSection";
import FAQEditorial from "@/components/landing/editorial/FAQEditorial";
import FinalCTAEditorial from "@/components/landing/editorial/FinalCTAEditorial";
import LandingFooter from "@/components/landing/editorial/LandingFooter";

export const metadata = {
  title: "Auto-Apply to Top Tech Jobs — The Black Female Engineer",
  description:
    "BFE finds and applies you to the best new jobs every day. Apply to Stripe, Airbnb, Figma, Anthropic, and 17+ more top companies on autopilot.",
};

export default function LandingPage() {
  return (
    <div className="editorial-landing bg-[#fdfaf6] text-[#2a2828]" style={{ colorScheme: "light" }}>
      <PagePresenceTracker page="landing" />
      <LandingNav />
      <main>
        <HeroSection />
        <CompanyMarquee />
        <HowItWorksEditorial />
        <PullQuote />
        <ComparisonTable />
        <PricingSection />
        <FAQEditorial />
        <FinalCTAEditorial />
      </main>
      <LandingFooter />
    </div>
  );
}

import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = {
  title: "Get Started — The Black Female Engineer",
  description: "Set up your auto-apply profile and start landing interviews at top tech companies.",
};

interface Props {
  searchParams: Promise<{ legacy?: string }>;
}

export default async function GetStartedPage({ searchParams }: Props) {
  const { legacy } = await searchParams;
  if (legacy !== "1") {
    redirect("/start");
  }
  return <OnboardingWizard />;
}

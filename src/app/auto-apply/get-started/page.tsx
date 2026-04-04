import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = {
  title: "Get Started — The Black Female Engineer",
  description: "Set up your auto-apply profile and start landing interviews at top tech companies.",
};

export default async function GetStartedPage() {
  const session = await auth();

  // Already onboarded → go to applications
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompletedAt: true },
    });
    if (user?.onboardingCompletedAt) {
      redirect("/profile/applications");
    }
  }

  return <OnboardingWizard isSignedIn={!!session?.user} />;
}

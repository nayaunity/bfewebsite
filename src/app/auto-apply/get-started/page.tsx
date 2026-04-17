import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const session = await auth();

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompletedAt: true },
    });
    if (user?.onboardingCompletedAt) {
      redirect("/profile/applications");
    }
  }

  // New resume-first flow lives at /start. Keep the old 25-step wizard
  // available under ?legacy=1 as a bailout for the next 2 weeks.
  if (legacy !== "1") {
    redirect("/start");
  }

  return <OnboardingWizard isSignedIn={!!session?.user} />;
}

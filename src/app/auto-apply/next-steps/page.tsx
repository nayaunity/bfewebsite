import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { OnboardingSync } from "@/components/OnboardingSync";
import NextStepsClient from "./NextStepsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Next Steps — The Black Female Engineer",
  description: "Prepare for your auto-apply experience. Upload role-specific resumes to maximize your applications.",
};

export default async function NextStepsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=" + encodeURIComponent("/auto-apply/next-steps?onboarding=complete"));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      subscriptionTier: true,
      resumes: {
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          name: true,
          fileName: true,
          blobUrl: true,
          keywords: true,
          isFallback: true,
          uploadedAt: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <>
      <Suspense>
        <OnboardingSync />
      </Suspense>
      <NextStepsClient
        userName={user.firstName || user.email?.split("@")[0] || ""}
        initialResumes={user.resumes}
        tier={user.subscriptionTier || "free"}
      />
    </>
  );
}

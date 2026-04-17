import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StartClient from "./StartClient";

export const metadata = {
  title: "Get Started — The Black Female Engineer",
  description: "Upload your resume. We'll find jobs for you in 10 seconds.",
};

export default async function StartPage() {
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

  return <StartClient />;
}

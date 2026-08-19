import type { Metadata } from "next";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import QuizPageViewTracker from "./PageViewTracker";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "What's Your Monetizable Skill? | AI Income Lab",
  description:
    "In 12 questions, find the one skill you should be getting paid for, and exactly how AI turns it into income.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MonetizableSkillQuizPage() {
  return (
    <>
      <PagePresenceTracker page="monetizable-skill-quiz" />
      <QuizPageViewTracker />
      <QuizClient />
    </>
  );
}

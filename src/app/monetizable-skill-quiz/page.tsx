import type { Metadata } from "next";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import QuizPageViewTracker from "./PageViewTracker";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "What's Your PHASE Path? | AI Income Lab",
  description:
    "A 14-question skill diagnostic. Find your skill family, your delivery mode, and the exact buyer-finding prompt to run today.",
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

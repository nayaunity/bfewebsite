import type { Metadata } from "next";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import CreatorsPageViewTracker from "./PageViewTracker";
import CreatorsForm from "./CreatorsForm";

export const metadata: Metadata = {
  title: "For Knowledge Creators | The Black Female Engineer",
  description:
    "Your first winning post is 3 moves away. A private community with AI systems for creators turning expertise-driven content into real revenue.",
  openGraph: {
    title: "For Knowledge Creators | The Black Female Engineer",
    description:
      "Your first winning post is 3 moves away. A private community with AI systems for creators turning expertise-driven content into real revenue.",
    images: [
      {
        url: "/images/waitlist-og.png",
        alt: "For knowledge creators — The Black Female Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "For Knowledge Creators | The Black Female Engineer",
    description:
      "Your first winning post is 3 moves away. A private community with AI systems for creators turning expertise-driven content into real revenue.",
    images: ["/images/waitlist-og.png"],
  },
};

export default function CreatorsPage() {
  return (
    <>
      <PagePresenceTracker page="skool-creators" />
      <CreatorsPageViewTracker />
      <CreatorsForm />
    </>
  );
}

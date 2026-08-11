import type { Metadata } from "next";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import CreatorsPageViewTracker from "./PageViewTracker";
import CreatorsForm from "./CreatorsForm";

export const metadata: Metadata = {
  title: "For Knowledge Creators | The Black Female Engineer",
  description:
    "A private community for coaches, course creators, and consultants building AI-powered digital products. $67/mo. First cohort opens August 17.",
  openGraph: {
    title: "For Knowledge Creators | The Black Female Engineer",
    description:
      "A private community for coaches, course creators, and consultants building AI-powered digital products. $67/mo. First cohort opens August 17.",
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
      "A private community for coaches, course creators, and consultants building AI-powered digital products. $67/mo. First cohort opens August 17.",
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

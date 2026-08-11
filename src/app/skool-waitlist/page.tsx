import type { Metadata } from "next";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import WaitlistPageViewTracker from "./PageViewTracker";
import WaitlistForm from "./WaitlistForm";

export const metadata: Metadata = {
  title: "Join the Waitlist | The Black Female Engineer",
  description:
    "A private community for professionals turning what they already know into an income stream, with AI doing the heavy lifting. First cohort opens August 17.",
  openGraph: {
    title: "Join the Waitlist | The Black Female Engineer",
    description:
      "A private community for professionals turning what they already know into an income stream, with AI doing the heavy lifting. First cohort opens August 17.",
    images: [
      {
        url: "/images/waitlist-og.png",
        alt: "Join the waitlist — The Black Female Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Join the Waitlist | The Black Female Engineer",
    description:
      "A private community for professionals turning what they already know into an income stream, with AI doing the heavy lifting. First cohort opens August 17.",
    images: ["/images/waitlist-og.png"],
  },
};

export default function WaitlistPage() {
  return (
    <>
      <PagePresenceTracker page="skool-waitlist" />
      <WaitlistPageViewTracker />
      <WaitlistForm />
    </>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community | The Black Female Engineer",
  description:
    "Join The Black Female Engineer community. Share micro-wins, connect with peers, and celebrate your tech journey together.",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Resource | The Black Female Engineer",
  robots: { index: false },
};

export default function SubmitResourceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

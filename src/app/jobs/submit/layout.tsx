import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Job | The Black Female Engineer",
  robots: { index: false },
};

export default function SubmitJobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

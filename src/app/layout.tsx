import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { SessionProvider } from "@/providers/SessionProvider";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Black Female Engineer | Resources, Jobs & Community",
  description: "Empowering Black women in engineering with resources, job opportunities, mentorship, and a supportive community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

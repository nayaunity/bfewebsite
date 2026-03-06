import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { SessionProvider } from "@/providers/SessionProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import JsonLd from "@/components/JsonLd";
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
  metadataBase: new URL("https://www.theblackfemaleengineer.com"),
  alternates: { canonical: "/" },
  title: "The Black Female Engineer | Resources, Jobs & Community",
  description:
    "Empowering young professionals interested in tech with resources, job opportunities, mentorship, and a supportive community.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "The Black Female Engineer",
    title: "The Black Female Engineer | Resources, Jobs & Community",
    description:
      "Empowering young professionals interested in tech with resources, job opportunities, mentorship, and a supportive community.",
    images: [{ url: "/images/bfeimage2.png", alt: "The Black Female Engineer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Black Female Engineer | Resources, Jobs & Community",
    description:
      "Empowering young professionals interested in tech with resources, job opportunities, mentorship, and a supportive community.",
    images: ["/images/bfeimage2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} antialiased`}>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://www.theblackfemaleengineer.com/#organization",
                name: "The Black Female Engineer",
                url: "https://www.theblackfemaleengineer.com",
                logo: "https://www.theblackfemaleengineer.com/images/bfeimage2.png",
                description:
                  "Empowering young professionals interested in tech with resources, job opportunities, mentorship, and a supportive community.",
                sameAs: [
                  "https://www.instagram.com/theblackfemaleengineer",
                  "https://www.linkedin.com/company/theblackfemaleengineer",
                  "https://www.youtube.com/@theblackfemaleengineer",
                  "https://www.tiktok.com/@theblackfemaleengineer",
                ],
              },
              {
                "@type": "WebSite",
                "@id": "https://www.theblackfemaleengineer.com/#website",
                name: "The Black Female Engineer",
                url: "https://www.theblackfemaleengineer.com",
                publisher: {
                  "@id": "https://www.theblackfemaleengineer.com/#organization",
                },
              },
            ],
          }}
        />
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

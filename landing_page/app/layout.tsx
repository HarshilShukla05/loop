import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const serif = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz"],
});

const SITE_URL = "https://loop.so";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "loop — Turn Instagram comments into DMs. Get that reach.",
  description:
    "loop auto-sends your link, code, or freebie the moment someone comments your keyword on a post or reel. Follow-gating and email capture built in. Flat ₹200/month — unlimited comments, unlimited DMs, no viral penalty.",
  keywords: [
    "Instagram DM automation",
    "comment to DM",
    "ManyChat alternative",
    "Instagram automation India",
    "creator tools",
    "auto DM",
  ],
  openGraph: {
    title: "loop — Turn Instagram comments into DMs. Get that reach.",
    description:
      "Flat ₹200/month. Unlimited comments, unlimited DMs, no hidden tiers. Stop being penalized for going viral.",
    url: SITE_URL,
    siteName: "loop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "loop — Get that reach.",
    description:
      "Auto-DM your link the moment someone comments your keyword. Flat ₹200/month, unlimited everything.",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

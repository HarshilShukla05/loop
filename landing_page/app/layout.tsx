import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import CursorGlow from "@/components/ui/CursorGlow";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#161513" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script
          // Apply the saved theme before first paint to avoid a flash of the
          // wrong scheme. Shares the "loop-theme" key with the dashboard.
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("loop-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")})()`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <CursorGlow />
        {children}
      </body>
    </html>
  );
}

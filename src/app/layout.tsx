import type { Metadata } from "next";
import { EB_Garamond, Source_Serif_4, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import CustomCursor from "@/components/common/CustomCursor";
import OpeningIntro from "@/components/common/OpeningIntro";
import { EVENT_CONFIG } from "@/config/event";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-jetbrains",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
});

const siteUrl = "https://aiodyssey.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${EVENT_CONFIG.eventName} | 24-Hour Innovation Hackathon`,
    template: `%s | ${EVENT_CONFIG.eventName}`,
  },
  description: EVENT_CONFIG.description,
  openGraph: {
    title: EVENT_CONFIG.eventName,
    description: EVENT_CONFIG.tagline,
    url: siteUrl,
    siteName: EVENT_CONFIG.eventName,
    locale: "en_IN",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark scroll-smooth ${ebGaramond.variable} ${sourceSerif.variable} ${jetbrains.variable} ${inter.variable}`}
    >
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased selection:bg-[var(--accent)] selection:text-[var(--bg-secondary)] overflow-x-hidden font-serif min-h-screen flex flex-col">
        <div className="relative bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen overflow-x-hidden font-serif flex flex-col">
          <OpeningIntro />
          <CustomCursor />
          <Navbar />
          <main className="relative z-10 w-full flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

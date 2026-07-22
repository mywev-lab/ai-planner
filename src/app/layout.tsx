import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Planner — Assistente Executivo",
  description:
    "Um assistente executivo de IA que organiza o seu tempo de forma proativa, usando OpenAI + Google Calendar.",
  // Private tool: keep it out of every index, cache and AI answer.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Non-standard but widely-read opt-out signals for AI crawlers. */}
        <meta name="robots" content="noai, noimageai" />
        <meta name="CCBot" content="nofollow" />
        <meta name="GPTBot" content="noindex, nofollow" />
        <meta name="ClaudeBot" content="noindex, nofollow" />
        <meta name="Google-Extended" content="noindex, nofollow" />
      </head>
      <body>{children}</body>
    </html>
  );
}

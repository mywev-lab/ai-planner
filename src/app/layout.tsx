import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Planner — Executive Assistant",
  description:
    "An AI executive assistant that proactively organizes your time using OpenAI + Google Calendar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

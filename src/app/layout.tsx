import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fleet Tracker · Singapore",
  description:
    "Real-time fleet tracking and dispatch dashboard built with Next.js, TypeScript, Redux Toolkit, Tailwind CSS and Leaflet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The init script adds the "dark" class before React hydrates, so the attribute differs on purpose.
    <html lang="en-SG" suppressHydrationWarning>
      <head>
        {/* Runs before first paint, so a dark-mode user never sees a light flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}

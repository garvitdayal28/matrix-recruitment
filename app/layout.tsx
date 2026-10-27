import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Same family as the club site; the wdth axis gives the wide headline cut.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font" });

export const metadata: Metadata = {
  title: "Join MATRIX, JEC",
  description: "MATRIX, the tech club of Jabalpur Engineering College, is recruiting 1st and 2nd year students.",
};

// Black browser bar on mobile.
export const viewport: Viewport = { themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script adds the "js" class before React hydrates.
    <html lang="en" className={archivo.variable} suppressHydrationWarning>
      <head>
        {/* Reveal styles only hide content when JS is running, so the page never stays blank without it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

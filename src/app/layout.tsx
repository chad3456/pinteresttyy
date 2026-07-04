import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import Header from "@/components/Header";
import { ACCENT_COLOR, SITE_NAME } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const serifDisplay = Cormorant_Garamond({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "A private, curated collection of artwork.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${serifDisplay.variable} h-full antialiased`}
      style={{ "--accent": ACCENT_COLOR } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Header />
        {children}
      </body>
    </html>
  );
}

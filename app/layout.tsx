import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Media Multiviewer",
    template: "%s · Media Multiviewer",
  },
  applicationName: "Media Multiviewer",
  description: "A minimal local workspace for viewing up to four browser media sources together.",
  keywords: ["media multiviewer", "multiview", "tab capture", "local-first", "browser media"],
  authors: [{ name: "Andrea Urbani" }],
  creator: "Andrea Urbani",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}

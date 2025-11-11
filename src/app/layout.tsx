import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
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
    default: "Velocity — Precision Typing",
    template: "%s | Velocity",
  },
  description:
    "Desktop-first typing experience with real-time analytics, customizable themes, and secure email authentication.",
  icons: {
    icon: "/velocity.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background text-foreground">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProviders session={null}>{children}</AppProviders>
      </body>
    </html>
  );
}

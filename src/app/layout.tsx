import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WPMHero — Precision Typing",
    template: "%s | WPMHero",
  },
  description:
    "Desktop-first typing experience with real-time analytics, customizable themes, and secure email authentication.",
  icons: {
    icon: "/velocity.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en" className="dark bg-background text-foreground" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} antialiased`}
      >
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}

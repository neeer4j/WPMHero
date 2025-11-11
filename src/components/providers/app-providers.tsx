"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { type ReactNode, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { SupabaseProvider } from "@/components/providers/supabase-provider";

const posthogKey = env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

export type AppProvidersProps = {
  children: ReactNode;
  className?: string;
  session: Session | null;
};

export const AppProviders = ({ children, className, session }: AppProvidersProps) => {
  useEffect(() => {
    if (!posthogKey) return;
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });
  }, []);

  const content = (
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      {children}
      <Toaster position="top-center" richColors />
    </div>
  );

  const providers = posthogKey ? (
    <PostHogProvider client={posthog}>{content}</PostHogProvider>
  ) : (
    content
  );

  return <SupabaseProvider initialSession={session}>{providers}</SupabaseProvider>;
};

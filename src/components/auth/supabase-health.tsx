"use client";

import { useEffect, useState } from "react";
import { env } from "@/lib/env";

export function SupabaseHealthBanner() {
  const [reachable, setReachable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!env.NEXT_PUBLIC_SUPABASE_URL) {
      setReachable(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        // Try a simple network request to the Supabase auth base URL.
        // We don't expect a 200, but a network-level error (DNS) will throw.
        const url = `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/auth/v1/`;
        const res = await fetch(url, { method: "OPTIONS" });
        if (!cancelled) setReachable(true);
      } catch (err) {
        if (!cancelled) setReachable(false);
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  if (reachable === null || reachable === true) return null;

  return (
    <div className="w-full bg-rose-600 text-white text-center px-4 py-2 text-sm">
      Unable to reach Supabase auth endpoint. Authentication and result sync may be unavailable. Please check
      your NEXT_PUBLIC_SUPABASE_URL environment variable or network/DNS settings.
    </div>
  );
}

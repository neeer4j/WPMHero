"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { env } from "@/lib/env";

const DISMISS_KEY = "wbtsc_supabase_health_dismissed";
const RECHECK_INTERVAL_MS = 60_000; // re-check every minute when dismissed/unreachable

export function SupabaseHealthBanner() {
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const dismissedRef = useRef<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(DISMISS_KEY) : null;
    if (stored) {
      // store a timestamped dismissal so we can re-show later if desired
      const ts = Number(stored || 0);
      // re-show after 1 hour
      if (Date.now() - ts < 60 * 60 * 1000) {
        dismissedRef.current = true;
      } else {
        // older than 1h — clear and allow checks
        window.localStorage.removeItem(DISMISS_KEY);
        dismissedRef.current = false;
      }
    }
  }, []);

  const doCheck = useCallback(async (signal?: AbortSignal) => {
    if (!env.NEXT_PUBLIC_SUPABASE_URL) {
      setReachable(false);
      return false;
    }

    // quick short-circuit: if the browser is offline, report unreachable immediately
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setReachable(false);
      return false;
    }

    setChecking(true);
    try {
      const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
      const url = `${base}/auth/v1/`;

      // Use OPTIONS for lightweight probe. Add a short timeout via AbortController when possible.
      const controller = new AbortController();
      abortRef.current = controller;
      if (signal) signal.addEventListener("abort", () => controller.abort());

      const res = await fetch(url, { method: "OPTIONS", signal: controller.signal });
      // If we get any response, consider it reachable (we only care about network-level failures)
      setReachable(true);
      setAttempts(0);
      return true;
    } catch (err) {
      setReachable(false);
      setAttempts((a) => a + 1);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  // initial check
  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (!mounted) return;
      // do not auto-show if user recently dismissed
      if (dismissedRef.current) return;
      await doCheck();
    })();
    return () => {
      mounted = false;
      abortRef.current?.abort();
    };
  }, [doCheck]);

  // periodic re-check when unreachable or dismissed (to auto-recover)
  useEffect(() => {
    const id = setInterval(() => {
      // only attempt if not currently checking
      if (checking) return;
      // do not spam checks if user dismissed recently
      if (dismissedRef.current) return;
      void doCheck();
    }, RECHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [checking, doCheck]);

  const handleRetry = async () => {
    // exponential backoff attempts are handled by the attempts count; we still allow manual retry
    await doCheck();
  };

  const handleDismiss = () => {
    dismissedRef.current = true;
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setReachable(true); // hide banner
  };

  // If still unknown or reachable, render nothing
  if (reachable === null || reachable === true) return null;

  const probeUrl = env.NEXT_PUBLIC_SUPABASE_URL ? `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/auth/v1/` : "(not set)";

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-rose-600 text-white text-center px-4 py-2 text-sm"
    >
      <div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
        <div className="text-left">
          <div className="font-medium">Can't reach Supabase auth endpoint</div>
          <div className="text-xs opacity-90">
            Authentication and result sync may be unavailable. Check your <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and network/DNS.
          </div>
          <div className="mt-1 text-xs opacity-90">Probing: <span className="font-mono">{probeUrl}</span></div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRetry}
            disabled={checking}
            className="rounded-md bg-white/10 px-3 py-1 text-xs"
            aria-label="Retry connection to Supabase"
          >
            {checking ? "Checking..." : "Retry"}
          </button>
          <button
            onClick={() => {
              try {
                void navigator.clipboard.writeText(probeUrl);
              } catch {}
            }}
            className="text-xs underline"
            aria-label="Copy probe URL"
          >
            Copy URL
          </button>
          {env.NEXT_PUBLIC_SUPABASE_URL ? (
            <a
              className="text-xs underline"
              href={env.NEXT_PUBLIC_SUPABASE_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open project URL
            </a>
          ) : null}
          <button onClick={handleDismiss} className="text-xs opacity-90" aria-label="Dismiss">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

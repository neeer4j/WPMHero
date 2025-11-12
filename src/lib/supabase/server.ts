import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { env } from "@/lib/env";

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  let cookiesWritable = typeof cookieStore.set === "function" && typeof cookieStore.delete === "function";

  const safely = (operation: () => void, context: "set" | "delete") => {
    if (!cookiesWritable) return;
    try {
      operation();
    } catch (error) {
      cookiesWritable = false;
      if (process.env.NODE_ENV === "development") {
        console.warn(`Supabase cookie ${context} ignored in this context`, error);
      }
    }
  };

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        const cookie = cookieStore.get?.(name);
        if (!cookie) return undefined;
        return typeof cookie === "string" ? cookie : cookie.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        if (typeof cookieStore.set !== "function") return;
        safely(
          () =>
            cookieStore.set({
              name,
              value,
              ...options,
            }),
          "set",
        );
      },
      remove(name: string, options: CookieOptions) {
        if (typeof cookieStore.delete !== "function") return;
        safely(
          () =>
            cookieStore.delete({
              name,
              ...options,
            }),
          "delete",
        );
      },
    },
  });
};

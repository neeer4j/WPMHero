import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { env } from "@/lib/env";

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        const cookie = cookieStore.get?.(name);
        if (!cookie) return undefined;
        return typeof cookie === "string" ? cookie : cookie.value;
      },
      async set(name: string, value: string, options: CookieOptions) {
        if (typeof cookieStore.set !== "function") return;
        try {
          await Promise.resolve(
            cookieStore.set({
              name,
              value,
              ...options,
            }),
          );
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Supabase cookie set ignored in this context", error);
          }
        }
      },
      async remove(name: string, options: CookieOptions) {
        if (typeof cookieStore.delete !== "function") return;
        try {
          await Promise.resolve(
            cookieStore.delete({
              name,
              ...options,
            }),
          );
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Supabase cookie delete ignored in this context", error);
          }
        }
      },
    },
  });
};

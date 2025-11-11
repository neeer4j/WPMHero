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
      set(name: string, value: string, options: CookieOptions) {
        if (typeof cookieStore.set !== "function") return;
        cookieStore.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        if (typeof cookieStore.delete !== "function") return;
        cookieStore.delete({
          name,
          ...options,
        });
      },
    },
  });
};

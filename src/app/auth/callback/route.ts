import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("next") ?? "/";

  if (code) {
  const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Failed to exchange Supabase auth code", error.message);
    }
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}

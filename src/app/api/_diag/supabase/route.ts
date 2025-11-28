import { NextResponse } from "next/server";
import { env } from "@/lib/env";

// Simple server-side probe to check if the deployment can reach Supabase auth endpoint.
export async function GET() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ ok: false, error: "NEXT_PUBLIC_SUPABASE_URL not set" }, { status: 400 });
  }

  const probeUrl = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(probeUrl, { method: "OPTIONS", signal: controller.signal });
    clearTimeout(timeout);
    return NextResponse.json(
      {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        url: probeUrl,
      },
      { status: 200 },
    );
  } catch (err: any) {
    clearTimeout(timeout);
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err), url: probeUrl },
      { status: 502 },
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getPosthog } from "@/lib/posthog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  wpm: z.number().min(0),
  rawWpm: z.number().min(0),
  accuracy: z.number().min(0).max(100),
  consistency: z.number().min(0).max(100),
  duration: z.number().positive(),
  charactersTyped: z.number().min(0),
  charactersCorrect: z.number().min(0),
  charactersIncorrect: z.number().min(0),
  errors: z.number().min(0),
  textLength: z.number().min(0),
  keypresses: z
    .array(z.object({
      key: z.string(),
      timestamp: z.number(),
      correct: z.boolean(),
    }))
    .max(5000)
    .optional(),
  snapshots: z
    .array(
      z.object({
        wpm: z.number(),
        rawWpm: z.number(),
        accuracy: z.number(),
        consistency: z.number(),
        errors: z.number(),
        charactersTyped: z.number(),
        timestamp: z.number(),
      }),
    )
    .max(5000)
    .optional(),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const body = await request.json().catch(() => null);

  const parseResult = payloadSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parseResult.error.flatten() }, { status: 400 });
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = parseResult.data;

  const modeSlug = `standard-${data.duration}`;

  const userMetadata = (session.user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const displayName = userMetadata.full_name ?? userMetadata.name ?? null;

  await prisma.user.upsert({
    where: { id: session.user.id },
    update: {
      email: session.user.email ?? undefined,
      name: displayName ?? undefined,
    },
    create: {
      id: session.user.id,
      email: session.user.email,
      name: displayName,
    },
  });

  const hasSettings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });
  if (!hasSettings) {
    await prisma.userSettings.create({
      data: {
        userId: session.user.id,
      },
    });
  }

  const mode = await prisma.typingMode.upsert({
    where: { slug: modeSlug },
    update: {
      config: {
        duration: data.duration,
        discipline: "words",
      },
    },
    create: {
      slug: modeSlug,
      name: `Standard ${data.duration}s`,
      description: "Default desktop-first drill",
      category: "standard",
      config: {
        duration: data.duration,
        discipline: "words",
      },
    },
  });

  await prisma.testResult.create({
    data: {
      userId: session.user.id,
      modeId: mode.id,
      durationSeconds: Math.round(data.duration),
      wpm: Math.round(data.wpm),
      rawWpm: Math.round(data.rawWpm),
      accuracy: data.accuracy,
      consistency: data.consistency,
      charactersTyped: data.charactersTyped,
      charactersCorrect: data.charactersCorrect,
      charactersIncorrect: data.charactersIncorrect,
      streak: 0,
      settingsSnapshot: {
        theme: "minimal",
        duration: data.duration,
        snapshots: data.snapshots ?? [],
      },
      keypressTimings: data.keypresses ?? [],
      tags: ["desktop", "minimal"],
    },
  });

  await redis.zadd(`velocity:leaderboard:${data.duration}`, {
    score: data.wpm,
    member: `${session.user.id}:${Date.now()}`,
  });

  const posthog = getPosthog();
  posthog?.capture({
    event: "typing_result_recorded",
    distinctId: session.user.id,
    properties: {
      wpm: data.wpm,
      rawWpm: data.rawWpm,
      accuracy: data.accuracy,
      consistency: data.consistency,
      duration: data.duration,
    },
  });

  return NextResponse.json({ ok: true });
}

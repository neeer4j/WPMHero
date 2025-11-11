import { Suspense } from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { TypingWorkspace } from "@/modules/typing/components/typing-workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const features = [
  {
    title: "Precision analytics",
    description: "Track WPM, accuracy, and consistency in real time with millisecond snapshots.",
  },
  {
    title: "Theme controls",
    description: "Switch between minimal and playful palettes or craft your own colorway.",
  },
  {
    title: "Pro-grade drills",
    description: "Multiple disciplines, difficulty tiers, and desktop-first ergonomics built in.",
  },
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LeaderboardEntry = {
  userId: string;
  name: string;
  avatar: string | null;
  wpm: number;
  recordedAt: number;
};

async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  const key = "velocity:leaderboard:60";
  try {
    const entries = await redis.zrange<{ member: string; score: number }[]>(key, 0, 4, {
      rev: true,
      withScores: true,
    });

    const userIds = entries.map((entry) => entry.member.split(":")[0]);

    const users = (await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    })) as { id: string; name: string | null; image: string | null }[];

    return entries.map((entry) => {
      const [userId, timestamp] = entry.member.split(":");
      const user = users.find((record) => record.id === userId);
      return {
        userId,
        name: user?.name ?? "Anonymous",
        avatar: user?.image ?? null,
        wpm: Math.round(entry.score),
        recordedAt: Number(timestamp) || Date.now(),
      };
    });
  } catch (error) {
    console.error("Failed to load leaderboard", error);
    return [];
  }
}

const LeaderboardPreview = async () => {
  const leaderboard = await loadLeaderboard();

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Sign in and complete a test to claim an early spot.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The board is empty. Be the first to set a record!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
        <CardDescription>Top 60-second sessions. Refreshes in real time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboard.map((entry, index) => (
          <div key={`${entry.userId}-${entry.recordedAt}`} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium leading-none">{entry.name}</p>
              <p className="text-xs text-muted-foreground">{entry.wpm} WPM</p>
            </div>
            <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12">
      <section className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div className="space-y-6">
          <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm">
            World&apos;s Best Typing Speed Checker · Private beta
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Type with surgical precision. Analyse with pro-grade telemetry.
          </h1>
          <p className="text-lg text-muted-foreground">
            Velocity delivers a desktop-first experience inspired by Monkeytype — rebuilt with Next.js 14,
            Supabase Auth, Redis, and serverless analytics. Laser-focused, distraction-free, and customizable down to the accent
            color.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="#typing">Start typing</Link>
            </Button>
            {!session && (
              <Button asChild variant="outline" size="lg">
                <Link href="/signin">Sign in with email</Link>
              </Button>
            )}
          </div>
          <Separator className="my-8" />
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {feature.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Suspense fallback={<div className="h-full w-full animate-pulse rounded-2xl bg-muted" />}> 
          <LeaderboardPreview />
        </Suspense>
      </section>

      <section id="typing" className={cn("rounded-3xl border bg-card/60 p-8 shadow-sm backdrop-blur")}> 
        <TypingWorkspace />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Secure email sign-in</CardTitle>
            <CardDescription>Supabase Auth handles passwordless magic links out of the box.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Authenticate once, keep your stats in sync across devices.</p>
            <p>All data persists in Supabase Postgres through Prisma.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Observability baked in</CardTitle>
            <CardDescription>PostHog tracks funnels, Redis powers real-time leaderboards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Every session is captured with anonymized performance metrics.</p>
            <p>Flip the switch to playful mode when you need a morale boost.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const DEFAULT_DURATION = 60;
const MAX_ENTRIES = 25;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const durationParam = url.searchParams.get("duration");
  const duration = durationParam ? Number(durationParam) : DEFAULT_DURATION;

  const leaderboardKey = `wpmhero:leaderboard:${duration}`;
  let entries: { member: string; score: number }[] = [];

  try {
    const rawEntries = await redis.zrange(leaderboardKey, 0, MAX_ENTRIES - 1, {
      rev: true,
      withScores: true,
    });
    entries = Array.isArray(rawEntries) ? (rawEntries as { member: string; score: number }[]) : [];
  } catch (error) {
    console.error("Failed to load leaderboard from Redis", { leaderboardKey, error });
    return NextResponse.json({ duration, leaderboard: [] }, { status: 200 });
  }

  const userIds = entries.map((entry) => entry.member.split(":")[0]);

  const users = userIds.length
    ? ((await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, image: true },
      })) as { id: string; name: string | null; image: string | null }[])
    : [];

  const leaderboard = entries.map((entry) => {
    const [userId, timestamp] = entry.member.split(":");
    const user = users.find((userRecord) => userRecord.id === userId);

    return {
      userId,
      name: user?.name ?? "Anonymous",
      avatar: user?.image,
      wpm: Math.round(entry.score),
      recordedAt: Number(timestamp),
    };
  });

  return NextResponse.json({ duration, leaderboard });
}

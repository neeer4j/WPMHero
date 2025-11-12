import Link from "next/link";
import { redirect } from "next/navigation";
import type { TestResult } from "@prisma/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const integerFormatter = new Intl.NumberFormat("en-US");
const decimalFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const percentFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export const dynamic = "force-dynamic";
export const revalidate = 0;

const formatInteger = (value: number) => integerFormatter.format(Math.round(value));
const formatDecimal = (value: number) => decimalFormatter.format(value);
const formatPercent = (value: number) => `${percentFormatter.format(value)}%`;

const formatElapsed = (totalSeconds: number) => {
  if (totalSeconds <= 0) {
    return "0s";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (hours === 0 && minutes === 0 && seconds > 0) parts.push(`${seconds}s`);
  if (parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
};

const formatDateTime = (value: Date) => dateTimeFormatter.format(value);

type NumericLike = number | bigint | string | { toNumber?: () => number; toString?: () => string } | null | undefined;

const toNumber = (value: NumericLike) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (typeof value === "object") {
    const candidate = value as { toNumber?: () => number; toString?: () => string };

    if (typeof candidate.toNumber === "function") {
      const converted = candidate.toNumber();
      if (Number.isFinite(converted)) {
        return converted;
      }
    }

    if (typeof candidate.toString === "function") {
      const parsed = Number(candidate.toString());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  const fallback = Number(value);
  return Number.isFinite(fallback) ? fallback : 0;
};

const normalizeRun = (run: TestResult | null) => {
  if (!run) return null;
  return {
    ...run,
    accuracy: toNumber(run.accuracy),
    consistency: toNumber(run.consistency),
  };
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;
  const userMetadata = (session.user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const displayName = userMetadata.full_name ?? userMetadata.name ?? session.user.email ?? "You";

  const [aggregate, recentResults, durationBreakdown, bestRunRaw, worstRunRaw, userRecord] = await Promise.all([
    prisma.testResult.aggregate({
      where: { userId },
      _count: { _all: true },
      _avg: { wpm: true, rawWpm: true, accuracy: true, consistency: true },
      _max: { wpm: true, accuracy: true, consistency: true },
      _min: { wpm: true, accuracy: true, consistency: true },
      _sum: { charactersTyped: true, durationSeconds: true },
    }),
    prisma.testResult.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }],
      take: 20,
    }),
    prisma.testResult.groupBy({
      where: { userId },
      by: ["durationSeconds"],
      _count: { _all: true },
      _avg: { wpm: true, accuracy: true, consistency: true },
      _max: { wpm: true },
      orderBy: {
        durationSeconds: "asc",
      },
    }),
    prisma.testResult.findFirst({
      where: { userId },
      orderBy: [{ wpm: "desc" }, { createdAt: "desc" }],
    }),
    prisma.testResult.findFirst({
      where: { userId },
      orderBy: [{ wpm: "asc" }, { createdAt: "desc" }],
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    }),
  ]);

  const totalSessions = aggregate._count._all ?? 0;
  const avgWpm = toNumber(aggregate._avg.wpm);
  const avgRawWpm = toNumber(aggregate._avg.rawWpm);
  const avgAccuracy = toNumber(aggregate._avg.accuracy);
  const avgConsistency = toNumber(aggregate._avg.consistency);
  const bestWpm = toNumber(aggregate._max.wpm);
  const worstWpm = toNumber(aggregate._min.wpm);
  const totalCharacters = toNumber(aggregate._sum.charactersTyped);
  const totalDurationSeconds = toNumber(aggregate._sum.durationSeconds);

  const normalizedBestRun = normalizeRun(bestRunRaw);
  const normalizedWorstRun = normalizeRun(worstRunRaw);

  const normalizedRecentResults = recentResults.map((result) => ({
    ...result,
    accuracy: toNumber(result.accuracy),
    consistency: toNumber(result.consistency),
  }));

  const recentSample = normalizedRecentResults.slice(0, 5);
  const recentAverage = recentSample.length
    ? recentSample.reduce((sum, item) => sum + item.wpm, 0) / recentSample.length
    : 0;

  const memberSince = userRecord?.createdAt ? formatDateTime(userRecord.createdAt) : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-12 px-6 py-12">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-arcade text-3xl uppercase tracking-[0.28em] text-foreground sm:text-4xl">{displayName}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Personalized telemetry for every run you have logged inside WPMHero. Track your bests, spotlight
              consistency, and monitor how your cadence evolves over time.
            </p>
            {memberSince ? (
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Member since {memberSince}</p>
            ) : null}
          </div>
          <Button asChild variant="outline" className="self-start rounded-full border-foreground/20 px-4 text-[0.65rem] uppercase tracking-[0.3em]">
            <Link href="/">Return to typing</Link>
          </Button>
        </div>
      </header>

      {totalSessions === 0 ? (
        <Card className="border-foreground/10 bg-card/80">
          <CardHeader>
            <CardTitle>No sessions recorded yet</CardTitle>
            <CardDescription>Complete a typing test to unlock your personalized analytics.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full px-4 text-[0.65rem] uppercase tracking-[0.3em]">
              <Link href="/">Start your first run</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-foreground/10 bg-card/80">
              <CardHeader>
                <CardTitle>Total sessions</CardTitle>
                <CardDescription>All recorded drills to date.</CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-semibold text-foreground">
                {formatInteger(totalSessions)}
              </CardContent>
            </Card>
            <Card className="border-foreground/10 bg-card/80">
              <CardHeader>
                <CardTitle>Average WPM</CardTitle>
                <CardDescription>Across every recorded duration.</CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-semibold text-foreground">
                {formatDecimal(avgWpm)}
              </CardContent>
            </Card>
            <Card className="border-foreground/10 bg-card/80">
              <CardHeader>
                <CardTitle>Average accuracy</CardTitle>
                <CardDescription>Precision maintained across sessions.</CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-semibold text-foreground">
                {formatPercent(avgAccuracy)}
              </CardContent>
            </Card>
            <Card className="border-foreground/10 bg-card/80">
              <CardHeader>
                <CardTitle>Total typed characters</CardTitle>
                <CardDescription>All keystrokes tracked in the arena.</CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-semibold text-foreground">
                {formatInteger(totalCharacters)}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="border-foreground/10 bg-card/80">
              <CardHeader>
                <CardTitle>Personal best</CardTitle>
                <CardDescription>Fastest recorded sprint.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="text-3xl font-semibold text-foreground">{formatInteger(bestWpm)} WPM</p>
                {normalizedBestRun ? (
                  <ul className="space-y-1 text-xs uppercase tracking-[0.3em]">
                    <li>Duration · {normalizedBestRun.durationSeconds}s</li>
                    <li>Accuracy · {formatPercent(normalizedBestRun.accuracy)}</li>
                    <li>Logged · {formatDateTime(normalizedBestRun.createdAt)}</li>
                  </ul>
                ) : (
                  <p>No runs available.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-foreground/10 bg-card/80">
              <CardHeader>
                <CardTitle>Consistency tracker</CardTitle>
                <CardDescription>Recent cadence over the last five drills.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="text-3xl font-semibold text-foreground">{formatDecimal(recentAverage)} WPM</p>
                <ul className="space-y-1 text-xs uppercase tracking-[0.3em]">
                  <li>Recent average (5) · {formatDecimal(recentAverage)} WPM</li>
                  <li>Lifetime raw average · {formatDecimal(avgRawWpm)} WPM</li>
                  <li>Consistency index · {formatDecimal(avgConsistency)}</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-foreground/10 bg-card/80">
              <CardHeader>
                <CardTitle>Endurance totals</CardTitle>
                <CardDescription>Time invested inside focused drills.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="text-3xl font-semibold text-foreground">{formatElapsed(totalDurationSeconds)}</p>
                <ul className="space-y-1 text-xs uppercase tracking-[0.3em]">
                  <li>Lowest recorded run · {formatInteger(worstWpm)} WPM</li>
                  {normalizedWorstRun ? <li>Logged · {formatDateTime(normalizedWorstRun.createdAt)}</li> : null}
                  <li>Lifetime accuracy · {formatPercent(avgAccuracy)}</li>
                  <li>Lifetime consistency · {formatDecimal(avgConsistency)}</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Card className="border-foreground/10 bg-card/80">
              <CardHeader>
                <CardTitle>Recent sessions</CardTitle>
                <CardDescription>Last 20 logged drills with precision metrics.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[32rem] table-auto text-left text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  <thead className="bg-background/70 text-[0.6rem]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium text-right">WPM</th>
                      <th className="px-3 py-2 font-medium text-right">Raw</th>
                      <th className="px-3 py-2 font-medium text-right">Accuracy</th>
                      <th className="px-3 py-2 font-medium text-right">Consistency</th>
                      <th className="px-3 py-2 font-medium text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedRecentResults.map((result) => (
                      <tr key={result.id} className="border-t border-foreground/10 text-[0.65rem]">
                        <td className="px-3 py-2 text-foreground">{formatDateTime(result.createdAt)}</td>
                        <td className="px-3 py-2 text-right text-foreground">{formatInteger(result.wpm)}</td>
                        <td className="px-3 py-2 text-right text-foreground">{formatInteger(result.rawWpm)}</td>
                        <td className="px-3 py-2 text-right text-foreground">{formatPercent(result.accuracy)}</td>
                        <td className="px-3 py-2 text-right text-foreground">{formatDecimal(result.consistency)}</td>
                        <td className="px-3 py-2 text-right text-foreground">{result.durationSeconds}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="border-foreground/10 bg-card/80">
              <CardHeader>
                <CardTitle>Duration breakdown</CardTitle>
                <CardDescription>Performance sliced by drill length.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="space-y-2 text-xs uppercase tracking-[0.3em]">
                  {durationBreakdown.map((bucket) => {
                    const bucketAvgWpm = toNumber(bucket._avg.wpm);
                    const bucketAvgAccuracy = toNumber(bucket._avg.accuracy);
                    const bucketMaxWpm = toNumber(bucket._max.wpm);

                    return (
                      <li key={bucket.durationSeconds} className="rounded-2xl border border-foreground/10 bg-background/70 px-4 py-3">
                      <div className="flex items-center justify-between text-foreground">
                        <span>{bucket.durationSeconds}s sessions</span>
                        <span>{formatInteger(bucket._count._all ?? 0)} runs</span>
                      </div>
                      <Separator className="my-2 border-dashed" />
                      <div className="flex flex-col gap-1 text-muted-foreground">
                        <span>Average WPM · {formatDecimal(bucketAvgWpm)}</span>
                        <span>Average accuracy · {formatPercent(bucketAvgAccuracy)}</span>
                        <span>Best WPM · {formatInteger(bucketMaxWpm)}</span>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

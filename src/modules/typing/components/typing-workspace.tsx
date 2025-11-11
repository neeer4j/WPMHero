"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Flame, Gauge, Keyboard, TimerReset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTypingStore } from "@/modules/typing/state";
import type { TypingSnapshot } from "@/modules/typing/types";
import { countTotalCharacters, formatSeconds, generateWordSequence } from "@/modules/typing/utils";

const DURATION_PRESETS = [15, 30, 60, 120];
const WORD_COUNT = 220;

const displayClasses = "rounded-xl border bg-card px-6 py-8 shadow-sm";

const filterKey = (key: string) => {
  const allowed = key.length === 1 || key === "Backspace" || key === "Enter" || key === "Tab";
  if (!allowed) return false;
  if (key === "Tab") return false;
  return true;
};

type StatTileProps = {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: "default" | "accent";
};

const StatTile = ({ label, value, icon, tone = "default" }: StatTileProps) => (
  <Card className={cn("h-full transition", tone === "accent" && "border-accent/60 shadow-md")}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
    </CardContent>
  </Card>
);

const SnapshotChart = ({ snapshots }: { snapshots: TypingSnapshot[] }) => {
  if (snapshots.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
        <span className="text-sm text-muted-foreground">Start typing to see live analytics</span>
      </div>
    );
  }

  const max = Math.max(...snapshots.map((snapshot) => snapshot.wpm), 40);

  return (
    <div className="flex h-32 items-end gap-1 rounded-lg border bg-background/60 p-3">
      {snapshots.slice(-60).map((snapshot) => {
        const height = Math.max(8, (snapshot.wpm / max) * 100);
        return (
          <div
            key={snapshot.timestamp}
            className="w-full max-w-[6px] rounded-full bg-gradient-to-t from-accent to-primary"
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
};

export const TypingWorkspace = () => {
  const [theme, setTheme] = useState<"minimal" | "playful">("minimal");
  const [accent, setAccent] = useState("cyan");
  const {
    text,
    caretIndex,
    started,
    completed,
    duration,
    remainingSeconds,
    wpm,
    rawWpm,
    accuracy,
    consistency,
    progress,
    errors,
    correct,
    incorrect,
    keypresses,
    snapshots,
    setText,
    setDuration,
    start,
    reset,
    registerKeypress,
    complete,
    tick,
  } = useTypingStore();

  const challengeChars = useMemo(() => countTotalCharacters(text), [text]);
  const flattenedText = useMemo(() => text.join(" "), [text]);

  useEffect(() => {
    if (text.length === 0) {
      setText(generateWordSequence(WORD_COUNT));
    }
  }, [setText, text.length]);

  useEffect(() => {
    const palettes: Record<string, { primary: string; accent: string; ring: string; secondary: string }> = {
      neutral: {
        primary: "hsl(220, 14%, 20%)",
        accent: "hsl(220, 13%, 91%)",
        ring: "hsl(220, 13%, 65%)",
        secondary: "hsl(220, 14%, 96%)",
      },
      cyan: {
        primary: "hsl(187, 94%, 37%)",
        accent: "hsl(187, 92%, 69%)",
        ring: "hsl(187, 90%, 48%)",
        secondary: "hsl(186, 73%, 93%)",
      },
      violet: {
        primary: "hsl(263, 70%, 50%)",
        accent: "hsl(263, 85%, 67%)",
        ring: "hsl(263, 74%, 58%)",
        secondary: "hsl(261, 68%, 96%)",
      },
      amber: {
        primary: "hsl(38, 92%, 50%)",
        accent: "hsl(38, 100%, 68%)",
        ring: "hsl(38, 92%, 60%)",
        secondary: "hsl(45, 100%, 96%)",
      },
      emerald: {
        primary: "hsl(142, 76%, 36%)",
        accent: "hsl(142, 70%, 45%)",
        ring: "hsl(142, 71%, 29%)",
        secondary: "hsl(142, 57%, 95%)",
      },
    };

    const palette = palettes[accent];
    if (!palette) return;

    const root = document.documentElement;
    root.style.setProperty("--primary", palette.primary);
    root.style.setProperty("--accent", palette.accent);
    root.style.setProperty("--ring", palette.ring);
    root.style.setProperty("--secondary", palette.secondary);
  }, [accent]);

  useEffect(() => {
    if (!started) return;

    const id = window.setInterval(() => {
      tick();
    }, 1000);

    return () => window.clearInterval(id);
  }, [started, tick]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!filterKey(event.key)) return;

  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
  if (!(target === document.body || target === document.documentElement)) return;

      event.preventDefault();

      if (!started) {
        start();
      }

      if (completed) {
        return;
      }

      if (event.key === "Backspace") {
        return;
      }

      const expected = flattenedText.charAt(caretIndex) ?? "";
      const received = event.key === "Enter" ? "\n" : event.key;
      const correctKey = received === expected || (received === " " && expected === " ");

      registerKeypress({
        key: received,
        correct: correctKey,
        timestamp: Date.now(),
      });

      if (caretIndex + 1 >= challengeChars) {
        complete();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [challengeChars, complete, flattenedText, caretIndex, registerKeypress, started, start, completed]);

  const submitResult = useCallback(async () => {
    try {
      const response = await fetch("/api/typing/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wpm,
          rawWpm,
          accuracy,
          consistency,
          duration,
          charactersTyped: correct + incorrect,
          charactersCorrect: correct,
          charactersIncorrect: incorrect,
          errors,
          keypresses,
          snapshots,
          textLength: challengeChars,
        }),
      });

      if (!response.ok) {
        console.error("Failed to persist result", await response.text());
      }
    } catch (error) {
      console.error("Failed to persist result", error);
    }
  }, [
    accuracy,
    challengeChars,
    consistency,
    correct,
    duration,
    errors,
    incorrect,
    keypresses,
    rawWpm,
    snapshots,
    wpm,
  ]);

  useEffect(() => {
    if (completed && keypresses.length > 0) {
      void submitResult();
    }
  }, [completed, keypresses.length, submitResult]);

  const highlightedText = useMemo(() => {
    const caret = caretIndex;
    return flattenedText.split("").map((char, index) => {
      const isCompleted = index < caret;
      const isCaret = index === caret;

      return (
        <span
          key={`${char}-${index}`}
          className={cn(
            "px-[1px] transition-colors",
            isCaret && "bg-accent/60 text-foreground rounded-sm",
            isCompleted && "text-primary",
            !isCompleted && !isCaret && "text-muted-foreground",
          )}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      );
    });
  }, [flattenedText, caretIndex]);

  const playfulMode = theme === "playful";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Velocity</h1>
          <p className="text-muted-foreground">
            Ultra-focused typing drills with real-time analytics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={theme} onValueChange={(value) => setTheme(value as "minimal" | "playful")}>
            <TabsList>
              <TabsTrigger value="minimal">Minimal</TabsTrigger>
              <TabsTrigger value="playful">Playful</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={accent} onValueChange={setAccent}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Accent" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="cyan">Cyan</SelectItem>
                <SelectItem value="violet">Violet</SelectItem>
                <SelectItem value="amber">Amber</SelectItem>
                <SelectItem value="emerald">Emerald</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => reset()} className="gap-2">
            <TimerReset className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

  <Card className={cn(displayClasses, playfulMode && "border-primary shadow-lg")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1 text-sm">
              <Keyboard className="mr-2 h-4 w-4" /> {WORD_COUNT} words
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              <Gauge className="mr-2 h-4 w-4" /> Difficulty: Standard
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flame className={cn("h-4 w-4", playfulMode && "text-orange-500")} />
            <span>{progress}% complete</span>
          </div>
        </div>

        <div className="mt-6 text-lg leading-relaxed tracking-wide text-muted-foreground">
          {highlightedText}
        </div>

        <Progress value={progress} className="mt-6" />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Duration</span>
          <Tabs value={String(duration)} onValueChange={(value) => setDuration(Number(value))}>
            <TabsList className="grid grid-cols-4">
              {DURATION_PRESETS.map((preset) => (
                <TabsTrigger key={preset} value={String(preset)}>
                  {preset}s
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button className="ml-auto" onClick={() => setText(generateWordSequence(WORD_COUNT))} variant="ghost">
            Shuffle words
          </Button>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-4">
        <StatTile label="WPM" value={wpm.toString()} icon={<Gauge className="h-5 w-5 text-primary" />} tone="accent" />
        <StatTile label="Accuracy" value={`${accuracy}%`} icon={<Keyboard className="h-5 w-5 text-muted-foreground" />} />
        <StatTile label="Raw WPM" value={rawWpm.toString()} icon={<Gauge className="h-5 w-5 text-muted-foreground" />} />
        <StatTile label="Consistency" value={`${consistency}%`} icon={<Flame className="h-5 w-5 text-muted-foreground" />} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session timeline</CardTitle>
            <p className="text-sm text-muted-foreground">Live WPM samples captured every few keystrokes.</p>
          </CardHeader>
          <CardContent>
            <SnapshotChart snapshots={snapshots} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Session summary</CardTitle>
            <p className="text-sm text-muted-foreground">Automatic data dispatches to your profile when signed in.</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Elapsed</span>
              <span className="font-medium">{formatSeconds(duration - remainingSeconds)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Characters typed</span>
              <span className="font-medium">{correct + incorrect}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Errors</span>
              <span className="font-medium">{errors}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Words remaining</span>
              <span className="font-medium">{Math.max(text.length - Math.floor(caretIndex / 6), 0)}</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

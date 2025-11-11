"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { RefreshCw, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTypingStore } from "@/modules/typing/state";
import { countTotalCharacters, formatSeconds, generateWordSequence } from "@/modules/typing/utils";

const DURATION_PRESETS = [15, 30, 60, 120];
const WORD_COUNT = 220;

const filterKey = (key: string) => {
  const allowed = key.length === 1 || key === "Backspace" || key === "Enter" || key === "Tab";
  if (!allowed) return false;
  if (key === "Tab") return false;
  return true;
};

const Stat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex flex-col items-center gap-1 text-center">
    <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{label}</span>
    <span className={cn("text-3xl font-semibold", highlight && "text-primary")}>{value}</span>
  </div>
);

type TypingWorkspaceProps = {
  isAuthenticated: boolean;
  userEmail?: string | null;
};

export const TypingWorkspace = ({ isAuthenticated, userEmail }: TypingWorkspaceProps) => {
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
            isCaret && "bg-foreground text-background",
            isCompleted && "text-foreground",
            !isCompleted && !isCaret && "text-muted-foreground",
          )}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      );
    });
  }, [flattenedText, caretIndex]);

  const elapsed = formatSeconds(duration - remainingSeconds);
  const remaining = formatSeconds(remainingSeconds);

  return (
    <div className="flex flex-1 flex-col items-center">
      <header className="flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold text-foreground">Velocity</span>
          <span className="hidden sm:inline">desktop drill · {duration}s</span>
        </div>
        <Tabs value={String(duration)} onValueChange={(value) => setDuration(Number(value))}>
          <TabsList className="rounded-full bg-muted/40 p-1">
            {DURATION_PRESETS.map((preset) => (
              <TabsTrigger
                key={preset}
                value={String(preset)}
                className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.3em]"
              >
                {preset}s
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <span className="hidden text-xs uppercase tracking-[0.3em] text-muted-foreground sm:inline">
              {userEmail ?? "Signed in"}
            </span>
          ) : (
            <Button asChild variant="ghost" size="sm" className="uppercase tracking-[0.3em]">
              <Link href="/signin">Sign in</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => reset()}
            aria-label="Reset session"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setText(generateWordSequence(WORD_COUNT))}
            aria-label="Shuffle words"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-12 px-6">
        <div className="w-full rounded-3xl border border-dashed bg-card/60 px-8 py-12 shadow-sm">
          <div className="text-balance text-2xl leading-relaxed tracking-[0.08em] text-muted-foreground sm:text-4xl">
            {highlightedText}
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-6">
          <Progress value={progress} className="h-1 w-full max-w-4xl" />
          <div className="grid w-full max-w-4xl grid-cols-2 gap-6 sm:grid-cols-6">
            <Stat label="WPM" value={wpm.toString()} highlight />
            <Stat label="Raw" value={rawWpm.toString()} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Consistency" value={`${consistency}%`} />
            <Stat label="Errors" value={errors.toString()} />
            <Stat label="Time" value={`${elapsed} / ${remaining}`} />
          </div>
          {!isAuthenticated && (
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Sign in to sync results and unlock leaderboards
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

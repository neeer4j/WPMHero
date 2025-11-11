"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, BarChart3, RefreshCw, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
  <div className="flex flex-col gap-1 rounded-2xl border border-foreground/5 bg-background/60 px-4 py-3 text-center shadow-sm backdrop-blur">
    <span className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">{label}</span>
    <span className={cn("text-3xl font-semibold", highlight && "text-primary")}>{value}</span>
  </div>
);

type TypingWorkspaceProps = {
  isAuthenticated: boolean;
  userEmail?: string | null;
  onExit?: () => void;
};

export const TypingWorkspace = ({ isAuthenticated, userEmail, onExit }: TypingWorkspaceProps) => {
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);

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
      if (event.key === "Escape" && onExit) {
        event.preventDefault();
        onExit();
        return;
      }
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
  }, [challengeChars, complete, flattenedText, caretIndex, registerKeypress, started, start, completed, onExit]);

  useEffect(() => {
    if (!viewportRef.current || !caretRef.current) return;
    const viewport = viewportRef.current;
    const caret = caretRef.current;
    const viewportWidth = viewport.clientWidth;
    const caretOffset = caret.offsetLeft;
    const buffer = viewportWidth * 0.35;
    const targetScroll = Math.max(0, caretOffset - buffer);

    viewport.scrollTo({ left: targetScroll, behavior: started ? "smooth" : "auto" });
  }, [caretIndex, started]);

  useEffect(() => {
    if (!viewportRef.current) return;
    if (!started) {
      viewportRef.current.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [started, flattenedText]);

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
          ref={isCaret ? caretRef : undefined}
          className={cn(
            "inline-block px-[1px] transition-colors duration-75",
            isCaret && "rounded-sm bg-foreground text-background",
            isCompleted && "text-foreground/70",
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
    <div className="flex min-h-dvh flex-col items-center bg-background">
      <header className="w-full max-w-5xl px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2.5rem] border border-foreground/15 bg-card/70 px-6 py-4 text-sm shadow-xl backdrop-blur">
          <div className="flex flex-wrap items-center gap-4">
            {onExit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 rounded-full border border-foreground/15 bg-background/70 px-4 text-[0.65rem] uppercase tracking-[0.3em] text-foreground transition hover:border-foreground/40"
                onClick={onExit}
              >
                <ArrowLeft className="h-3 w-3" />
                Menu
              </Button>
            )}
            <div className="flex items-center gap-3">
              <span className="font-arcade text-sm uppercase text-foreground">WPMHero</span>
              <span className="hidden text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground sm:inline">
                Focused drill · {duration}s
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="hidden items-center gap-2 rounded-full border border-foreground/15 bg-background/70 px-4 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground sm:flex">
                <span>{userEmail ?? "Signed in"}</span>
              </div>
            ) : (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full border-foreground/20 bg-background px-4 text-[0.65rem] uppercase tracking-[0.3em]"
              >
                <Link href="/signin">Sign in</Link>
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>

  <div className="mt-3 flex w-full flex-wrap items-center gap-4 rounded-3xl border border-foreground/10 bg-card/60 px-5 py-2 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
          <div className="flex min-w-[12rem] items-center gap-3 text-foreground">
            <span className="font-arcade text-xs uppercase">Session Controls</span>
            <span className="hidden sm:inline text-muted-foreground">Adjust your drill in real time</span>
          </div>
          <Tabs value={String(duration)} onValueChange={(value) => setDuration(Number(value))} className="flex-row items-center gap-0">
            <TabsList className="rounded-full border border-foreground/10 bg-background/70 p-1 shadow-sm">
              {DURATION_PRESETS.map((preset) => (
                <TabsTrigger
                  key={preset}
                  value={String(preset)}
                  className="rounded-full px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em]"
                >
                  {preset}s
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="ml-auto flex items-center gap-2 text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-foreground/10 bg-background/70"
              onClick={() => reset()}
              aria-label="Reset session"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-foreground/10 bg-background/70"
              onClick={() => setText(generateWordSequence(WORD_COUNT))}
              aria-label="Shuffle words"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-6 py-4">
        <div className="w-full rounded-3xl border border-foreground/5 bg-card/70 px-6 py-7 shadow-xl backdrop-blur">
          <div
            ref={viewportRef}
            className="relative h-36 w-full overflow-x-scroll overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex h-full items-center whitespace-nowrap text-[clamp(1.5rem,2vw+1rem,2.5rem)] leading-relaxed tracking-[0.08em] text-muted-foreground">
              {highlightedText}
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-4xl flex-col items-center gap-1 text-center">
          <span className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">Current WPM</span>
          <span className="font-arcade text-4xl text-foreground sm:text-5xl">{Math.round(wpm)}</span>
        </div>

        <div className="flex w-full flex-col items-center gap-5">
          <div className="flex w-full max-w-4xl items-center gap-4 rounded-2xl border border-foreground/5 bg-background/80 px-6 py-2.5 shadow-sm backdrop-blur">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              {progress}%
            </span>
          </div>

          {completed && (
            <div className="flex w-full max-w-4xl flex-col items-center gap-1.5 rounded-3xl border border-primary/30 bg-primary/10 px-5 py-5 text-center">
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-primary/80">Final WPM</span>
              <span className="font-arcade text-5xl text-primary sm:text-6xl">{Math.round(wpm)}</span>
              <span className="text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
                Accuracy {accuracy}% · Raw {rawWpm} WPM · Consistency {consistency}%
              </span>
            </div>
          )}

          <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="WPM" value={wpm.toString()} highlight />
            <Stat label="Raw Speed" value={rawWpm.toString()} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Consistency" value={`${consistency}%`} />
            <Stat label="Errors" value={errors.toString()} />
            <Stat label="Clock" value={`${elapsed} / ${remaining}`} />
          </div>
          {!isAuthenticated && (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-5 py-3 text-xs uppercase tracking-[0.3em] text-primary">
              <BarChart3 className="h-4 w-4" />
              Sync results and climb the WPMHero leaderboard by signing in
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

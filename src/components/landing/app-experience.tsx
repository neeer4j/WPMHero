"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Keyboard, TrophyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TypingWorkspace } from "@/modules/typing/components/typing-workspace";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const highlights = [
  {
    title: "Arcade precision",
    description: "Every keystroke is scored instantly with uncompromising accuracy.",
  },
  {
    title: "Reactive telemetry",
    description: "Track live WPM, raw speed, accuracy, and consistency like an esports HUD.",
  },
  {
    title: "Leaderboard ready",
    description: "Authenticate once to sync runs and climb the global WPMHero ladder.",
  },
];

type WelcomeScreenProps = {
  onBegin: () => void;
};

const WelcomeScreen = ({ onBegin }: WelcomeScreenProps) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onBegin();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBegin]);

  return (
    <div className="flex min-h-dvh flex-col items-center bg-background px-6 py-8 text-foreground">
      <header className="flex w-full max-w-5xl items-center justify-between rounded-[2.5rem] border border-foreground/15 bg-card/70 px-6 py-3 text-[0.65rem] uppercase tracking-[0.3em] shadow-xl backdrop-blur">
        <span className="font-arcade text-sm uppercase text-foreground">WPMHero</span>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="hidden sm:inline">Arcade typing simulator</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 py-6">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
          <section className="flex flex-col gap-8 text-center lg:text-left">
            <div className="space-y-4">
              <p className="font-arcade text-xs uppercase text-muted-foreground">Arcade typing simulator</p>
              <h1 className="font-arcade text-4xl leading-tight tracking-[0.25em] sm:text-5xl">WPMHERO</h1>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:mx-0 sm:text-base">
                Inspired by Monkeytype, rebuilt for obsessive typists. Smash high scores, fine-tune cadence, and keep AI-ranked
                analytics all inside a minimalist black-and-white arena.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((highlight) => (
                <div
                  key={highlight.title}
                  className="rounded-2xl border border-foreground/15 bg-card/80 p-4 text-left shadow-lg backdrop-blur"
                >
                  <p className="font-arcade text-[0.65rem] uppercase text-muted-foreground">{highlight.title}</p>
                  <p className="mt-3 text-xs leading-6 text-foreground/80 sm:text-sm">{highlight.description}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <div className="rounded-3xl border border-foreground/15 bg-card/80 p-5 text-left shadow-xl backdrop-blur">
              <p className="font-arcade text-xs uppercase text-muted-foreground">Meet the developer</p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground sm:text-sm">
                Follow the build, study the internals, and leave a star to keep WPMHero evolving.
              </p>
              <a
                href="https://github.com/neeer4j/WPMHero"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-foreground/25 px-4 py-2 text-[0.65rem] uppercase tracking-[0.28em] text-foreground transition hover:border-foreground hover:bg-foreground hover:text-background"
              >
                GitHub
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>

            <div className="rounded-3xl border border-foreground/15 bg-background/60 p-5 text-left shadow-inner">
              <p className="font-arcade text-[0.65rem] uppercase text-muted-foreground">Arcade briefing</p>
              <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Keyboard className="mt-0.5 h-4 w-4 text-foreground/60" />
                  <span>Hit Enter or Space to jump straight into the typing arena.</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrophyIcon className="mt-0.5 h-4 w-4 text-foreground/60" />
                  <span>Authenticate to log every run, compare personal records, and climb leaderboards.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={onBegin}
            className="font-arcade flex items-center gap-3 rounded-full border border-foreground/30 bg-foreground px-7 py-3 text-background transition hover:scale-[1.03]"
          >
            Enter typing test
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">Press Enter to start · Esc to return here</p>
        </div>
      </main>
    </div>
  );
};

type AppExperienceProps = {
  isAuthenticated: boolean;
  userEmail: string | null;
};

export const AppExperience = ({ isAuthenticated, userEmail }: AppExperienceProps) => {
  const [stage, setStage] = useState<"welcome" | "typing">("welcome");

  return stage === "welcome" ? (
    <WelcomeScreen onBegin={() => setStage("typing")} />
  ) : (
    <TypingWorkspace
      isAuthenticated={isAuthenticated}
      userEmail={userEmail}
      onExit={() => setStage("welcome")}
    />
  );
};

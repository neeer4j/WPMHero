"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Keyboard, TrophyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TypingWorkspace } from "@/modules/typing/components/typing-workspace";

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
    <div className="flex min-h-screen flex-col items-center justify-between gap-12 bg-background px-6 py-16 text-foreground">
      <div className="flex w-full max-w-5xl flex-col gap-12 text-center">
        <div className="space-y-6">
          <p className="font-arcade text-xs uppercase text-muted-foreground">Arcade typing simulator</p>
          <h1 className="font-arcade text-4xl leading-tight tracking-[0.25em] sm:text-5xl">WPMHERO</h1>
          <p className="mx-auto max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            Inspired by Monkeytype, rebuilt for obsessive typists. Smash high scores, fine-tune cadence, and keep AI-ranked
            analytics all inside a minimalist black-and-white arena.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {highlights.map((highlight) => (
            <div
              key={highlight.title}
              className="rounded-3xl border border-foreground/15 bg-card/80 p-6 text-left shadow-xl backdrop-blur"
            >
              <p className="font-arcade text-xs uppercase text-muted-foreground">{highlight.title}</p>
              <p className="mt-3 text-sm leading-6 text-foreground/80">{highlight.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-5xl flex-col gap-12 rounded-[2.5rem] border border-dashed border-foreground/20 bg-card/70 p-10 shadow-2xl backdrop-blur">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6 text-left">
            <p className="font-arcade text-xs uppercase text-muted-foreground">Meet the developer</p>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-foreground/20 bg-background/70 text-sm font-semibold">
                NV
              </div>
              <div>
                <p className="font-arcade text-sm uppercase text-foreground">Neeraj Venu</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Full-stack crafter of focused experiences. Designing low-latency feedback loops for creatives, gamers, and
                  speed typists.
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  <a
                    href="mailto:neerajvenu2020@gmail.com"
                    className="rounded-full border border-foreground/20 px-3 py-1 transition hover:border-foreground hover:text-foreground"
                  >
                    Say hello
                  </a>
                  <a
                    href="https://github.com/neeer4j"
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-foreground"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-foreground/15 bg-background/60 p-6 text-left shadow-inner">
            <p className="font-arcade text-xs uppercase text-muted-foreground">Arcade briefing</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
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
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={onBegin}
            className="font-arcade flex items-center gap-3 rounded-full border border-foreground/40 bg-foreground px-8 py-4 text-background transition hover:scale-105"
          >
            Enter typing test
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Press Enter to start · Esc to return here</p>
        </div>
      </div>
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

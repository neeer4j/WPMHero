"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { generateWordSequence } from "@/modules/typing/utils";

type FallingWord = {
  id: string;
  text: string;
  x: number; // percent (0-100)
  y: number; // px
  speed: number; // px per second
};

const LEVEL_WPM = [20, 30, 40, 50, 60];
const GAME_DURATION_SECONDS = 60;

export default function GameArena() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const [words, setWords] = useState<FallingWord[]>([]);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const wordPoolRef = useRef<string[]>([]);

  useEffect(() => {
    // Prepare a pool of words (split the generated long sequence)
    const seq = generateWordSequence(400);
    // `generateWordSequence` already returns a string[]
    wordPoolRef.current = seq.slice();
  }, []);

  const spawnWord = useCallback(() => {
    const pool = wordPoolRef.current;
    if (!pool.length) return;
    const text = pool[Math.floor(Math.random() * pool.length)];
    const id = Math.random().toString(36).slice(2, 9);
    const x = Math.random() * 80 + 5; // percent, avoid edges
    // map level WPM to base fall speed (px/s). baseline 20 WPM -> 40 px/s
    const baseSpeed = 40 * (LEVEL_WPM[levelIndex] / 20);
    const speedVariance = baseSpeed * (0.85 + Math.random() * 0.4);

    setWords((s) => [...s, { id, text, x, y: 0, speed: speedVariance }]);
  }, [levelIndex]);

  // Spawning cadence derived from current target WPM
  useEffect(() => {
    if (!running) return;
    let spawnTimer: number | null = null;
    const spawnLoop = () => {
      // spawn interval in ms based on level WPM (approx one word per targetWPM / minute)
      const targetWpm = LEVEL_WPM[levelIndex];
      const msPerWord = Math.max(250, Math.round(60000 / targetWpm));
      spawnWord();
      spawnTimer = window.setTimeout(spawnLoop, msPerWord / (0.9 + Math.random() * 0.4));
    };

    spawnLoop();
    return () => {
      if (spawnTimer) window.clearTimeout(spawnTimer);
    };
  }, [running, levelIndex, spawnWord]);

  // Level progression every 12 seconds
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLevelIndex((i) => Math.min(LEVEL_WPM.length - 1, i + 1));
    }, 12000);
    return () => window.clearInterval(id);
  }, [running]);

  // Animation frame loop to move words
  useEffect(() => {
    if (!running) return;

    const step = (t: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = t;
      const dt = (t - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = t;

      setElapsed((e) => e + dt);

      setWords((list) => {
        const containerHeight = containerRef.current?.clientHeight ?? 400;
        const updated = list
          .map((w) => ({ ...w, y: w.y + w.speed * dt }))
          .filter((w) => {
            // remove words that have fallen beyond bottom
            if (w.y > containerHeight - 24) {
              // missed word
              return false;
            }
            return true;
          });

        return updated;
      });

      if (elapsed >= GAME_DURATION_SECONDS) {
        setRunning(false);
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Auto-stop when time ends
  useEffect(() => {
    if (elapsed >= GAME_DURATION_SECONDS && running) {
      setRunning(false);
    }
  }, [elapsed, running]);

  const handleStart = () => {
    setWords([]);
    setElapsed(0);
    setLevelIndex(0);
    setScore(0);
    setTyped("");
    setRunning(true);
    // focus the input so users can start typing immediately without clicking
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only handle keys when running
    if (!running) return;

    const key = e.key;

    // Prevent space from scrolling the page; only use it for submitting words when focused
    if (key === " ") {
      e.preventDefault();
    }

    if (key === "Enter" || key === " ") {
      e.preventDefault();
      const value = typed.trim();
      if (!value) return;

      // find matching words equal to value and pick the one closest to bottom (largest y)
      setWords((list) => {
        let bestIndex = -1;
        let bestY = -Infinity;
        for (let i = 0; i < list.length; i++) {
          if (list[i].text === value && list[i].y > bestY) {
            bestY = list[i].y;
            bestIndex = i;
          }
        }

        if (bestIndex >= 0) {
          setScore((s) => s + 1);
          const copy = [...list];
          copy.splice(bestIndex, 1);
          return copy;
        }

        // no exact match: do nothing for now
        return list;
      });

      setTyped("");
    }
  };

  const handleSubmitResult = async () => {
    const minutes = GAME_DURATION_SECONDS / 60;
    const wpm = Math.round(score / minutes);
    try {
      await fetch('/api/typing/results', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wpm,
          rawWpm: wpm,
          accuracy: 100, // approximate for arcade
          consistency: 0,
          duration: GAME_DURATION_SECONDS,
          charactersTyped: score * 5,
          charactersCorrect: score * 5,
          charactersIncorrect: 0,
          errors: 0,
          keypresses: [],
          snapshots: [],
          textLength: score * 5,
        }),
      });
    } catch (err) {
      console.error('Failed to submit arcade result', err);
      // non-blocking
    }
  };

  // when running becomes false after a game, submit results once
  useEffect(() => {
    if (!running && elapsed > 0) {
      void handleSubmitResult();
      toast.success(`Run complete — score ${score}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="w-full max-w-4xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground">Time</div>
            <div className="font-arcade text-2xl">{Math.max(0, GAME_DURATION_SECONDS - Math.floor(elapsed))}s</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground">Level</div>
            <div className="font-arcade text-xl">{LEVEL_WPM[levelIndex]} WPM</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground">Score</div>
            <div className="font-arcade text-xl">{score}</div>
          </div>
        </div>

        <div ref={containerRef} className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-foreground/10 bg-card/80 p-4">
          {words.map((w) => {
            // determine if this is the best-match candidate for the current typed prefix
            const typedPrefix = typed.trim();
            const isMatchPrefix = typedPrefix.length > 0 && w.text.startsWith(typedPrefix);
            // choose highest (closest-to-bottom) matching word to highlight
            let highlight = false;
            if (isMatchPrefix) {
              // find the candidate with max y among words that startWith typedPrefix
              const candidates = words.filter((c) => c.text.startsWith(typedPrefix));
              const maxY = Math.max(...candidates.map((c) => c.y));
              highlight = w.y === maxY;
            }

            return (
              <div
                key={w.id}
                style={{ left: `${w.x}%`, transform: `translateY(${w.y}px)`, position: 'absolute' }}
                className="pointer-events-none rounded px-2 py-1 text-sm font-medium bg-background/90 text-foreground/90 shadow"
              >
                {highlight && typedPrefix.length > 0 ? (
                  <>
                    <span className="text-emerald-400">{w.text.slice(0, typedPrefix.length)}</span>
                    <span className="opacity-90">{w.text.slice(typedPrefix.length)}</span>
                  </>
                ) : (
                  w.text
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex w-full items-center gap-3">
          <input
            className="flex-1 rounded px-3 py-2 bg-background/70 text-foreground"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={handleInputKey}
            placeholder={running ? 'Type the falling words and press space/enter' : 'Press Start to begin'}
            disabled={!running}
          />
          {!running ? (
            <button onClick={handleStart} className="rounded-full bg-foreground px-4 py-2 text-background">
              Start
            </button>
          ) : (
            <button onClick={() => setRunning(false)} className="rounded-full border border-foreground/10 px-4 py-2">
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


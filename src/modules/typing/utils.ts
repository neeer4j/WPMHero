import { nanoid } from "nanoid";

import type { KeypressSample, TypingSnapshot } from "@/modules/typing/types";

const fallbackWords = [
  "horizon",
  "velocity",
  "syntax",
  "momentum",
  "canvas",
  "quantum",
  "glyph",
  "cascade",
  "echo",
  "neuron",
  "catalyst",
  "lattice",
  "orbit",
  "phoenix",
  "vector",
  "zenith",
];

export const makeChallengeId = () => nanoid(12);

export const generateWordSequence = (length: number, source?: string[]): string[] => {
  const words = source && source.length > 0 ? source : fallbackWords;
  const sequence: string[] = [];

  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * words.length);
    sequence.push(words[index]);
  }

  return sequence;
};

type StatAccumulator = {
  charactersTyped: number;
  correct: number;
  errors: number;
  samples: KeypressSample[];
};

const initialAccumulator: StatAccumulator = {
  charactersTyped: 0,
  correct: 0,
  errors: 0,
  samples: [],
};

const charactersPerWord = 5;

export const computeSnapshot = (keypresses: KeypressSample[]): TypingSnapshot => {
  if (keypresses.length === 0) {
    return {
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      consistency: 100,
      errors: 0,
      charactersTyped: 0,
      timestamp: Date.now(),
    };
  }

  const { charactersTyped, correct, errors, samples } = keypresses.reduce<StatAccumulator>(
    (acc, sample) => {
      const totalCharacters = acc.charactersTyped + 1;
      const totalCorrect = acc.correct + (sample.correct ? 1 : 0);
      const totalErrors = acc.errors + (sample.correct ? 0 : 1);

      acc.samples.push(sample);

      return {
        charactersTyped: totalCharacters,
        correct: totalCorrect,
        errors: totalErrors,
        samples: acc.samples,
      };
    },
    { ...initialAccumulator },
  );

  const elapsed = Math.max(
    (keypresses[keypresses.length - 1]?.timestamp - keypresses[0]?.timestamp) / 1000,
    1,
  );
  const minutes = elapsed / 60;

  const rawWpm = Math.round((charactersTyped / charactersPerWord) / minutes);
  const accuracy = Math.max(0, Math.round((correct / Math.max(charactersTyped, 1)) * 100));
  const wpm = Math.round(rawWpm * (accuracy / 100));

  const windows = 12;
  const windowSize = Math.max(1, Math.floor(samples.length / windows));
  const windowSpeeds: number[] = [];

  for (let i = 0; i < samples.length; i += windowSize) {
    const windowSamples = samples.slice(i, i + windowSize);
    if (windowSamples.length === 0) continue;

    const windowElapsed =
      (windowSamples[windowSamples.length - 1].timestamp - windowSamples[0].timestamp) / 1000 || 1;
    const windowMinutes = windowElapsed / 60;
    const windowRaw = Math.round((windowSamples.length / charactersPerWord) / windowMinutes);
    windowSpeeds.push(windowRaw);
  }

  const avgSpeed = windowSpeeds.reduce((acc, val) => acc + val, 0) / Math.max(windowSpeeds.length, 1);
  const consistency = Math.max(
    0,
    Math.round(
      100 -
        windowSpeeds.reduce((acc, val) => acc + Math.abs(val - avgSpeed), 0) /
          Math.max(windowSpeeds.length, 1),
    ),
  );

  return {
    wpm: Number.isFinite(wpm) ? wpm : 0,
    rawWpm: Number.isFinite(rawWpm) ? rawWpm : 0,
    accuracy,
    consistency,
    errors,
    charactersTyped,
    timestamp: Date.now(),
  };
};

export const formatSeconds = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

export const countTotalCharacters = (words: string[]) =>
  words.reduce((total, word) => total + word.length, 0) + Math.max(words.length - 1, 0);

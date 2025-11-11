import { create } from "zustand";

import type { KeypressSample, TypingStore } from "@/modules/typing/types";
import { countTotalCharacters, computeSnapshot } from "@/modules/typing/utils";

const DEFAULT_DURATION = 60;

const createInitialState = () => ({
  text: [] as string[],
  caretIndex: 0,
  wordIndex: 0,
  started: false,
  completed: false,
  duration: DEFAULT_DURATION,
  remainingSeconds: DEFAULT_DURATION,
  keypresses: [] as KeypressSample[],
  snapshots: [] as ReturnType<typeof computeSnapshot>[],
  wpm: 0,
  rawWpm: 0,
  accuracy: 100,
  consistency: 100,
  progress: 0,
  errors: 0,
  correct: 0,
  incorrect: 0,
});

export const useTypingStore = create<TypingStore>((set, get) => ({
  ...createInitialState(),
  setText: (text) =>
    set(() => ({
      text,
      caretIndex: 0,
      wordIndex: 0,
      progress: 0,
      keypresses: [],
      snapshots: [],
    })),
  setDuration: (seconds) =>
    set((state) => ({
      duration: seconds,
      remainingSeconds: seconds,
      started: false,
      completed: false,
      keypresses: [],
      snapshots: [],
      caretIndex: state.caretIndex,
    })),
  start: () =>
    set((state) => {
      if (state.started) return state;
      return {
        ...state,
        started: true,
        completed: false,
        remainingSeconds: state.duration,
        keypresses: [],
        snapshots: [],
        caretIndex: 0,
        wordIndex: 0,
        errors: 0,
        correct: 0,
        incorrect: 0,
      };
    }),
  reset: () => set(() => ({ ...createInitialState(), text: get().text })),
  registerKeypress: (sample) =>
    set((state) => {
      if (!state.started || state.completed) return state;

      const caretIndex = state.caretIndex + 1;
      const keypresses = [...state.keypresses, sample];
  const snapshot = computeSnapshot(keypresses);

      const totalChars = countTotalCharacters(state.text);
      const progress = Math.min(100, Math.round((caretIndex / Math.max(totalChars, 1)) * 100));

      const correct = state.correct + (sample.correct ? 1 : 0);
      const incorrect = state.incorrect + (sample.correct ? 0 : 1);
      const errors = incorrect;

      const wordsJoined = state.text.join(" ");
      const currentChar = wordsJoined.charAt(caretIndex - 1);
      const isSpace = currentChar === " ";
      const wordIndex = isSpace ? state.wordIndex + 1 : state.wordIndex;

      return {
        ...state,
        caretIndex,
        wordIndex,
        keypresses,
        snapshots: [...state.snapshots, snapshot],
        wpm: snapshot.wpm,
        rawWpm: snapshot.rawWpm,
        accuracy: snapshot.accuracy,
        consistency: snapshot.consistency,
        progress,
        errors,
        correct,
        incorrect,
      };
    }),
  complete: () =>
    set((state) => {
      if (state.completed) return state;
  const snapshot = computeSnapshot(state.keypresses);
      return {
        ...state,
        completed: true,
        started: false,
        wpm: snapshot.wpm,
        rawWpm: snapshot.rawWpm,
        accuracy: snapshot.accuracy,
        consistency: snapshot.consistency,
      };
    }),
  tick: () =>
    set((state) => {
      if (!state.started || state.completed) return state;
      const remainingSeconds = Math.max(state.remainingSeconds - 1, 0);
  const snapshot = computeSnapshot(state.keypresses);

      const nextState = {
        ...state,
        remainingSeconds,
        wpm: snapshot.wpm,
        rawWpm: snapshot.rawWpm,
        accuracy: snapshot.accuracy,
        consistency: snapshot.consistency,
      };

      if (remainingSeconds <= 0) {
        nextState.completed = true;
        nextState.started = false;
      }

      return nextState;
    }),
}));

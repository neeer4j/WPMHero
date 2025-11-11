import { create } from "zustand";

import type { TypingStore } from "@/modules/typing/types";
import { computeSnapshot } from "@/modules/typing/utils";

const DEFAULT_DURATION = 60;

const createBlankInputs = (target: string) =>
  Array.from({ length: target.length }, () => null as string | null);

const calculateProgress = (correctCharacters: number, totalCharacters: number) =>
  Math.min(100, Math.round((correctCharacters / Math.max(totalCharacters, 1)) * 100));

export const useTypingStore = create<TypingStore>((set, get) => ({
  text: [],
  targetText: "",
  inputs: [],
  caretIndex: 0,
  wordIndex: 0,
  started: false,
  completed: false,
  duration: DEFAULT_DURATION,
  remainingSeconds: DEFAULT_DURATION,
  keypresses: [],
  snapshots: [],
  wpm: 0,
  rawWpm: 0,
  accuracy: 100,
  consistency: 100,
  progress: 0,
  errors: 0,
  correct: 0,
  incorrect: 0,
  correctCharCount: 0,
  pendingErrors: 0,
  setText: (text) => {
    const duration = get().duration ?? DEFAULT_DURATION;
    const targetText = text.join(" ");

    set(() => ({
      text,
      targetText,
      inputs: createBlankInputs(targetText),
      caretIndex: 0,
      wordIndex: 0,
      started: false,
      completed: false,
      duration,
      remainingSeconds: duration,
      keypresses: [],
      snapshots: [],
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      consistency: 100,
      progress: 0,
      errors: 0,
      correct: 0,
      incorrect: 0,
      correctCharCount: 0,
      pendingErrors: 0,
    }));
  },
  setDuration: (seconds) =>
    set((state) => ({
      ...state,
      duration: seconds,
      remainingSeconds: seconds,
      started: false,
      completed: false,
      caretIndex: 0,
      wordIndex: 0,
      inputs: createBlankInputs(state.targetText),
      keypresses: [],
      snapshots: [],
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      consistency: 100,
      progress: 0,
      errors: 0,
      correct: 0,
      incorrect: 0,
      correctCharCount: 0,
      pendingErrors: 0,
    })),
  start: () =>
    set((state) => {
      if (state.started) return state;

      return {
        ...state,
        started: true,
        completed: false,
        remainingSeconds: state.duration,
        caretIndex: 0,
        wordIndex: 0,
        inputs: createBlankInputs(state.targetText),
        keypresses: [],
        snapshots: [],
        wpm: 0,
        rawWpm: 0,
        accuracy: 100,
        consistency: 100,
        progress: 0,
        errors: 0,
        correct: 0,
        incorrect: 0,
        correctCharCount: 0,
        pendingErrors: 0,
      };
    }),
  reset: () =>
    set((state) => ({
      text: state.text,
      targetText: state.targetText,
      inputs: createBlankInputs(state.targetText),
      caretIndex: 0,
      wordIndex: 0,
      started: false,
      completed: false,
      duration: state.duration,
      remainingSeconds: state.duration,
      keypresses: [],
      snapshots: [],
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      consistency: 100,
      progress: 0,
      errors: 0,
      correct: 0,
      incorrect: 0,
      correctCharCount: 0,
      pendingErrors: 0,
    })),
  inputCharacter: (key, timestamp) =>
    set((state) => {
      if (!state.started || state.completed) return state;
      if (state.caretIndex >= state.targetText.length) return state;

      const targetChar = state.targetText.charAt(state.caretIndex);
      const inputs = [...state.inputs];
      const previousValue = inputs[state.caretIndex];
      const wasCorrect = previousValue !== null && previousValue === targetChar;
      const wasError = previousValue !== null && previousValue !== targetChar;

      inputs[state.caretIndex] = key;

      const isCorrect = key === targetChar;
      const isError = !isCorrect;

      let correctCharCount = state.correctCharCount;
      if (wasCorrect && !isCorrect) {
        correctCharCount -= 1;
      } else if (!wasCorrect && isCorrect) {
        correctCharCount += 1;
      }

      let pendingErrors = state.pendingErrors;
      if (wasError && !isError) {
        pendingErrors -= 1;
      } else if (!wasError && isError) {
        pendingErrors += 1;
      }
      pendingErrors = Math.max(pendingErrors, 0);

      const keypresses = [...state.keypresses, { key, correct: isCorrect, timestamp }];
      const snapshot = computeSnapshot(keypresses);

      const totalChars = state.targetText.length;
      const progress = calculateProgress(correctCharCount, totalChars);

      const correct = state.correct + (isCorrect ? 1 : 0);
      const incorrect = state.incorrect + (isCorrect ? 0 : 1);
      const errors = incorrect;

      let wordIndex = state.wordIndex;
      if (targetChar === " " && isCorrect) {
        wordIndex += 1;
      }

      const nextState = {
        ...state,
        caretIndex: state.caretIndex + 1,
        wordIndex,
        inputs,
        keypresses,
        snapshots: [...state.snapshots, snapshot],
        wpm: snapshot.wpm,
        rawWpm: snapshot.rawWpm,
        accuracy: snapshot.accuracy,
        consistency: snapshot.consistency,
        progress,
        correct,
        incorrect,
        errors,
        correctCharCount,
        pendingErrors,
      };

      if (nextState.caretIndex >= totalChars && pendingErrors === 0) {
        nextState.completed = true;
        nextState.started = false;
      }

      return nextState;
    }),
  backspace: () =>
    set((state) => {
      if (!state.started || state.completed) return state;
      if (state.caretIndex <= 0) return state;

      const targetIndex = state.caretIndex - 1;
      const inputs = [...state.inputs];
      const previousValue = inputs[targetIndex];
      const targetChar = state.targetText.charAt(targetIndex);

      let correctCharCount = state.correctCharCount;
      let pendingErrors = state.pendingErrors;

      if (previousValue !== null) {
        if (previousValue === targetChar) {
          correctCharCount = Math.max(0, correctCharCount - 1);
        } else {
          pendingErrors = Math.max(0, pendingErrors - 1);
        }
      }

      inputs[targetIndex] = null;

      let wordIndex = state.wordIndex;
      if (targetChar === " " && previousValue === " ") {
        wordIndex = Math.max(0, wordIndex - 1);
      }

      const progress = calculateProgress(correctCharCount, state.targetText.length);

      return {
        ...state,
        caretIndex: targetIndex,
        wordIndex,
        inputs,
        progress,
        correctCharCount,
        pendingErrors,
        completed: false,
      };
    }),
  complete: () =>
    set((state) => {
      if (state.completed) return state;
      if (state.pendingErrors > 0 || state.caretIndex < state.targetText.length) {
        return state;
      }

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

export type Difficulty = "easy" | "standard" | "advanced" | "expert";

export type TypingDiscipline =
  | "words"
  | "sentences"
  | "quotes"
  | "numbers"
  | "code";

export type ThemeStyle = "minimal" | "playful";

export type TypingModeConfig = {
  id: string;
  label: string;
  description: string;
  durationOptions: number[];
  defaultDuration: number;
  discipline: TypingDiscipline;
  difficulty: Difficulty;
  isRanked?: boolean;
};

export type KeypressSample = {
  key: string;
  timestamp: number;
  correct: boolean;
};

export type TypingSnapshot = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  errors: number;
  charactersTyped: number;
  timestamp: number;
};

export type TypingTestState = {
  text: string[];
  caretIndex: number;
  wordIndex: number;
  started: boolean;
  completed: boolean;
  duration: number;
  remainingSeconds: number;
  keypresses: KeypressSample[];
  snapshots: TypingSnapshot[];
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  progress: number;
  errors: number;
  correct: number;
  incorrect: number;
};

export type TypingTestActions = {
  setText: (text: string[]) => void;
  setDuration: (seconds: number) => void;
  start: () => void;
  reset: () => void;
  registerKeypress: (sample: KeypressSample) => void;
  complete: () => void;
  tick: () => void;
};

export type TypingStore = TypingTestState & TypingTestActions;

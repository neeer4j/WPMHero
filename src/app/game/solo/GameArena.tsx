"use client";

import { useEffect } from "react";
import { TypingWorkspace } from "@/modules/typing/components/typing-workspace";
import { useTypingStore } from "@/modules/typing/state";

export default function GameArena() {
  const { setDuration, setText } = useTypingStore();

  useEffect(() => {
    // Solo sprint defaults to 60s and a shorter word set for arcade feel.
    setDuration(60);
    // keep default text generation handled by TypingWorkspace; nothing else needed.
  }, [setDuration, setText]);

  return (
    <TypingWorkspace isAuthenticated={false} />
  );
}

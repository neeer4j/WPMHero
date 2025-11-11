"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "wpmhero:theme";

type ThemeMode = "light" | "dark";

const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

export const ThemeToggle = () => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return stored === "light" || stored === "dark" ? stored : "dark";
  });

  useEffect(() => {
    applyTheme(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode]);

  const handleToggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full border border-foreground/15 bg-transparent text-foreground transition hover:border-foreground/40"
      onClick={handleToggle}
      aria-label="Toggle theme"
    >
      {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

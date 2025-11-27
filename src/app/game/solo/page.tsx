import dynamic from "next/dynamic";
import { metadata as rootMetadata } from "../page";

export const metadata = {
  title: "Solo · WPMHero Game",
};

// Load client arena dynamically to keep this a server component page.
const GameArena = dynamic(() => import("./GameArena"), { ssr: false });

export default function SoloPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="font-arcade text-3xl uppercase tracking-[0.25em]">Solo Sprint</h1>
        <p className="mt-2 text-sm text-muted-foreground">A focused 60s sprint — beat the clock, beat the board.</p>
      </header>

      <main className="flex-1">
        <GameArena />
      </main>
    </div>
  );
}

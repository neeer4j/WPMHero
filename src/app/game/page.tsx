import Link from "next/link";

export const metadata = {
  title: "Game · WPMHero",
};

export default function GameIndex() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="font-arcade text-4xl uppercase tracking-[0.25em]">WPMHero · Arcade</h1>
        <p className="text-sm text-muted-foreground">Play the single arcade mode — words fall and the speed ramps up over time.</p>
      </header>

      <main>
        <Link href="/game/solo" className="inline-flex items-center gap-3 rounded-full border border-foreground/15 bg-foreground px-6 py-3 text-sm font-arcade text-background">
          Play Arcade Mode
        </Link>
        <div className="mt-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-foreground/10 bg-transparent px-4 py-2 text-sm text-muted-foreground">
            More modes coming soon
          </div>
        </div>
      </main>
    </div>
  );
}

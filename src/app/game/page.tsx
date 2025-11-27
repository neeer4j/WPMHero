import Link from "next/link";

export const metadata = {
  title: "Game · WPMHero",
};

export default function GameIndex() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="rounded-2xl border border-foreground/10 bg-card/80 p-8 shadow-lg">
          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="font-arcade text-5xl uppercase tracking-[0.18em]">Arcade</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Single-player arcade mode — words fall from the top and speed ramps up as you play. Hit words
              by typing them and pressing <span className="font-medium">Space</span> or <span className="font-medium">Enter</span>.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/game/solo"
                className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-sm font-arcade text-background shadow-md hover:scale-[1.02] transition-transform"
              >
                Play Arcade
              </Link>

              <div className="rounded-full border border-foreground/10 bg-transparent px-4 py-2 text-sm text-muted-foreground">
                More modes coming soon
              </div>
            </div>

            <div className="mt-2 text-xs text-muted-foreground">Tip: Click Start on the arena to focus the input and begin typing.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

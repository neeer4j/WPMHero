import Link from "next/link";

export const metadata = {
  title: "Game · WPMHero",
};

export default function GameIndex() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="font-arcade text-4xl uppercase tracking-[0.25em]">WPMHero · Game Modes</h1>
        <p className="text-sm text-muted-foreground">Choose a mode and jump into the arena. Single-player modes for now.</p>
      </header>

      <main className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/game/solo" className="rounded-2xl border border-foreground/10 bg-card/80 p-6 text-center shadow hover:scale-[1.01] transition">
          <h2 className="font-arcade text-xl">Solo Sprint</h2>
          <p className="mt-2 text-sm text-muted-foreground">Classic timed sprint — try to beat your best WPM.</p>
        </Link>

        <Link href="/game/endurance" className="rounded-2xl border border-foreground/10 bg-card/80 p-6 text-center shadow hover:scale-[1.01] transition">
          <h2 className="font-arcade text-xl">Endurance</h2>
          <p className="mt-2 text-sm text-muted-foreground">Longer sessions to test staying power and consistency.</p>
        </Link>
      </main>
    </div>
  );
}

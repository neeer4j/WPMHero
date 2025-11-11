import { TypingWorkspace } from "@/modules/typing/components/typing-workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const WelcomeBanner = () => (
  <section className="mx-auto w-full max-w-5xl px-6">
    <div className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-primary/5 via-background to-background shadow-2xl">
      <div className="absolute right-12 top-12 hidden h-40 w-40 rounded-full bg-primary/10 blur-3xl md:block" />
      <div className="absolute bottom-10 left-16 hidden h-32 w-32 rounded-full bg-primary/20 blur-2xl md:block" />
      <div className="relative grid gap-10 px-8 py-10 md:grid-cols-[2fr_1fr] md:px-12 md:py-14">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Welcome to WPMHero
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Precision typing analytics built for pros who obsess over every keystroke.
          </h1>
          <p className="text-balance text-base leading-7 text-muted-foreground sm:text-lg">
            Practice in a distraction-free playground, monitor live performance, and sync results across devices.
            Every detail in WPMHero is tuned for deliberate practice and thoughtful iteration.
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-background/70 p-6 shadow-lg backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-primary/40 bg-primary/15 text-lg font-semibold text-primary">
              <span>NV</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Meet the developer
              </p>
              <h2 className="text-lg font-semibold text-foreground">Neeraj Venu</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Full-stack engineer focused on building polished tooling for creators and speed typists. Always tuning
                latency, ergonomics, and aesthetics.
              </p>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <a
                  href="mailto:neerajvenu2020@gmail.com"
                  className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary transition hover:bg-primary/20"
                >
                  Say hello
                </a>
                <a
                  href="https://github.com/neeer4j"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-primary/20 bg-primary/5 px-4 py-3 text-xs uppercase tracking-[0.3em] text-primary">
            Crafted for lightning-fast feedback loops
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <div className="flex min-h-screen flex-col gap-12 bg-background text-foreground">
      <div className="mt-16 flex justify-center">
        <WelcomeBanner />
      </div>
      <TypingWorkspace isAuthenticated={Boolean(session)} userEmail={session?.user?.email ?? null} />
    </div>
  );
}

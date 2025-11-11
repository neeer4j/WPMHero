import { TypingWorkspace } from "@/modules/typing/components/typing-workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TypingWorkspace isAuthenticated={Boolean(session)} userEmail={session?.user?.email ?? null} />
    </div>
  );
}

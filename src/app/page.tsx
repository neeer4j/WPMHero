import { AppExperience } from "@/components/landing/app-experience";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userMetadata = (session?.user?.user_metadata ?? {}) as { full_name?: string; name?: string };
  const displayName = userMetadata.full_name ?? userMetadata.name ?? null;
  const userEmail = session?.user?.email ?? null;

  return (
    <AppExperience isAuthenticated={Boolean(session)} userEmail={userEmail} userName={displayName} />
  );
}

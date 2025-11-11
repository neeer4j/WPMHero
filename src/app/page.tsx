import { AppExperience } from "@/components/landing/app-experience";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <AppExperience isAuthenticated={Boolean(session)} userEmail={session?.user?.email ?? null} />
  );
}

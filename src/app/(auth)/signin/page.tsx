import Link from "next/link";

import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SignInForm } from "@/components/auth/sign-in-form";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const session = await auth();

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center gap-8 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Sign in to Velocity</CardTitle>
          <CardDescription>Magic link authentication powered by Resend.</CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>You are already signed in as {session.user.email ?? "a registered user"}.</p>
              <p>
                Return to the <Link href="/" className="font-medium text-primary">dashboard</Link> or start a new
                session above.
              </p>
            </div>
          ) : (
            <SignInForm />
          )}
        </CardContent>
      </Card>
      <Separator />
      <div className="text-sm text-muted-foreground">
        Need help? Contact support once we open the beta beyond this build.
      </div>
    </div>
  );
}

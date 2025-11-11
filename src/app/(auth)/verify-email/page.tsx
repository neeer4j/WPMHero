import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            We just emailed you a secure magic link. Tap it within 10 minutes to complete sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Didn&apos;t receive anything? Inspect your spam folder or request another link from the sign-in page.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/signin">Back to sign-in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

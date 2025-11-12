import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : undefined;
  const mode = params?.get("mode") ?? "sign-in";
  const email = params?.get("email") ?? "your email";

  const title = mode === "sign-up" ? "Confirm your account" : "Check your inbox";
  const description =
    mode === "sign-up"
      ? `We just emailed a confirmation link to ${email}. Click it to activate your account.`
      : `We just emailed a secure magic sign-in link to ${email}. Tap it within 10 minutes to complete sign-in.`;

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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

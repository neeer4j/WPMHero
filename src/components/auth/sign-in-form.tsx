"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import { useSupabase } from "@/components/providers/supabase-provider";

const emailRegex = /^[\w.!#$%&'*+/=?^_`{|}~-]+@[\w-]+(\.[\w-]+)+$/;

type SignInMode = "sign-in" | "sign-up";

export const SignInForm = ({ className }: { className?: string }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<SignInMode>("sign-in");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { client } = useSupabase();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (mode === "sign-up" && trimmedName.length < 2) {
      toast.error("Please enter your name (at least 2 characters).");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Enter a valid email address");
      return;
    }

    setPending(true);

    const redirectHost = env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const commonOptions = {
      emailRedirectTo: `${redirectHost}/auth/callback`,
    } as const;

    const { error } = await client.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        ...commonOptions,
        shouldCreateUser: mode === "sign-in" ? false : true,
        data:
          mode === "sign-up" && trimmedName
            ? {
                full_name: trimmedName,
                name: trimmedName,
              }
            : undefined,
      },
    });

    setPending(false);

    if (error) {
      const normalizedMessage = error.message?.toLowerCase() ?? "";
      if (mode === "sign-in" && normalizedMessage.includes("user not found")) {
        toast.error("No account found for that email. Create one instead.");
        return;
      }

      if (mode === "sign-up" && normalizedMessage.includes("already registered")) {
        toast.error("That email is already registered. Try signing in instead.");
        return;
      }

      toast.error(error.message ?? "Unable to send magic link");
      return;
    }

    toast.success(
      mode === "sign-up"
        ? "Account created. Check your inbox for the confirmation link."
        : "Magic sign-in link sent. Check your inbox within 10 minutes.",
    );

    const params = new URLSearchParams({ mode, email: trimmedEmail });

    setEmail("");
    if (mode === "sign-up") {
      setName("");
    }
    setMode("sign-in");
    router.push(`/verify-email?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={mode === "sign-in" ? "default" : "outline"}
          onClick={() => setMode("sign-in")}
          disabled={pending}
          aria-pressed={mode === "sign-in"}
        >
          Existing user
        </Button>
        <Button
          type="button"
          variant={mode === "sign-up" ? "default" : "outline"}
          onClick={() => setMode("sign-up")}
          disabled={pending}
          aria-pressed={mode === "sign-up"}
        >
          New here
        </Button>
      </div>
      {mode === "sign-up" ? (
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            disabled={pending}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required={mode === "sign-up"}
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          disabled={pending}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Sending magic link..." : mode === "sign-in" ? "Send sign-in link" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        No passwords here—just a secure magic link sent to your inbox.
      </p>
    </form>
  );
};

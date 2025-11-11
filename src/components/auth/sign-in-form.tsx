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

export const SignInForm = ({ className }: { className?: string }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { client } = useSupabase();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      toast.error("Please enter your name (at least 2 characters).");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Enter a valid email address");
      return;
    }

    setPending(true);

    const redirectHost = env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error } = await client.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${redirectHost}/auth/callback`,
        data: {
          full_name: trimmedName,
          name: trimmedName,
        },
      },
    });

    setPending(false);

    if (error) {
      toast.error(error.message ?? "Unable to send magic link");
      return;
    }

    toast.success("Magic link sent. Check your inbox within 10 minutes.");
    setEmail("");
    setName("");
    router.push("/verify-email");
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
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
          required
        />
      </div>
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
        {pending ? "Sending magic link..." : "Send magic link"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        We only use your email to deliver the sign-in link. No passwords, ever.
      </p>
    </form>
  );
};

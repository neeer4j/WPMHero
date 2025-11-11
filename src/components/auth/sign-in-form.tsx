"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const emailRegex = /^[\w.!#$%&'*+/=?^_`{|}~-]+@[\w-]+(\.[\w-]+)+$/;

export const SignInForm = ({ className }: { className?: string }) => {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!emailRegex.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }

    setPending(true);
    const result = await signIn("email", {
      email,
      redirect: false,
      callbackUrl: "/",
    });
    setPending(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Magic link sent. Check your inbox.");
    setEmail("");
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
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

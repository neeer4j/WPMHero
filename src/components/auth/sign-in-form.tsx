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
  const [otp, setOtp] = useState("");
  const [mode, setMode] = useState<SignInMode>("sign-in");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { client } = useSupabase();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const trimmedOtp = otp.trim();

    if (step === "email") {
      if (mode === "sign-up" && trimmedName.length < 2) {
        toast.error("Please enter your name (at least 2 characters).");
        return;
      }

      if (!emailRegex.test(trimmedEmail)) {
        toast.error("Enter a valid email address");
        return;
      }

      setPending(true);

      const { error } = await client.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
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

        toast.error(error.message ?? "Unable to send OTP");
        return;
      }

      toast.success("OTP sent to your email.");
      setStep("otp");
    } else {
      // Verify OTP step
      if (trimmedOtp.length < 6) {
        toast.error("Please enter a valid 6-digit code.");
        return;
      }

      setPending(true);

      const { error } = await client.auth.verifyOtp({
        email: trimmedEmail,
        token: trimmedOtp,
        type: "email",
      });

      setPending(false);

      if (error) {
        toast.error(error.message ?? "Invalid OTP");
        return;
      }

      toast.success("Signed in successfully!");
      router.refresh();
      router.push("/");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {step === "email" && (
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
      )}

      {step === "email" ? (
        <>
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
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="otp">Enter Code</Label>
          <Input
            id="otp"
            type="text"
            placeholder="123456"
            value={otp}
            disabled={pending}
            onChange={(event) => setOtp(event.target.value)}
            autoComplete="one-time-code"
            required
            maxLength={6}
            className="text-center text-lg tracking-widest"
          />
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Sent to {email}</span>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-primary hover:underline hover:text-primary/90"
              disabled={pending}
            >
              Change email
            </button>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending
          ? "Please wait..."
          : step === "email"
            ? "Send Code"
            : "Verify & Sign In"}
      </Button>

      {step === "email" && (
        <p className="text-center text-sm text-muted-foreground">
          We'll send a one-time code to your email.
        </p>
      )}
    </form>
  );
};

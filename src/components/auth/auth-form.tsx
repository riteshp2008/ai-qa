"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { GoogleIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import type { ActionState } from "@/lib/forms/action-state";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthMode = "sign-in" | "sign-up";

const copy = {
  "sign-in": { title: "Welcome back", subtitle: "Sign in to continue to your organization.", submit: "Sign in", pending: "Signing in…" },
  "sign-up": { title: "Create your account", subtitle: "Start free. You'll set up or join an organization next.", submit: "Create account", pending: "Creating account…" },
} as const;

/** Supabase auth must run in the browser so the session cookie is set client-side. */
export function AuthForm({ mode, next, initialError }: { mode: AuthMode; next: string; initialError?: string }) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const text = copy[mode];
  const [state, setState] = useState<ActionState>(initialError ? { status: "error", message: initialError } : { status: "idle" });
  const [pending, setPending] = useState<"password" | "google" | null>(null);

  const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();

    setPending("password");
    setState({ status: "idle" });
    const supabase = createSupabaseBrowserClient();
    const result = isSignUp
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callbackUrl(), data: fullName ? { full_name: fullName } : undefined } })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setPending(null);
      setState({ status: "error", message: isSignUp ? result.error.message : "That email and password don't match an account." });
      return;
    }
    if (isSignUp && !result.data.session) {
      setPending(null);
      setState({ status: "success", message: `Check ${email} for a confirmation link to finish creating your account.` });
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function continueWithGoogle() {
    setPending("google");
    setState({ status: "idle" });
    const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl() } });
    if (error) {
      setPending(null);
      setState({ status: "error", message: "Google sign-in is unavailable right now." });
    }
  }

  const otherHref = `${isSignUp ? "/sign-in" : "/sign-up"}${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>
      <p className="mt-1.5 text-sm text-muted">{text.subtitle}</p>

      <Button variant="secondary" size="lg" className="mt-8 w-full" disabled={pending !== null} onClick={continueWithGoogle}>
        {pending === "google" ? <Spinner /> : <GoogleIcon />}
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-line" />or continue with email<span className="h-px flex-1 bg-line" />
      </div>

      <form className="grid gap-4" onSubmit={submit}>
        {isSignUp && (
          <Field label="Full name" htmlFor="fullName" optional>
            <Input id="fullName" name="fullName" autoComplete="name" placeholder="Ada Lovelace" maxLength={120} />
          </Field>
        )}
        <Field label="Work email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        </Field>
        <Field label="Password" htmlFor="password" hint={isSignUp ? "At least 8 characters." : undefined}>
          <Input id="password" name="password" type="password" minLength={8} required autoComplete={isSignUp ? "new-password" : "current-password"} />
        </Field>
        <FormAlert state={state} />
        <Button type="submit" size="lg" className="w-full" disabled={pending !== null}>
          {pending === "password" && <Spinner />}
          {pending === "password" ? text.pending : text.submit}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignUp ? "Already have an account?" : "New to Sentinel?"}{" "}
        <Link href={otherHref} className="font-medium text-brand-ink hover:underline">
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}

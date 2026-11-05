"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitPasswordAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice("");

    const supabase = createSupabaseBrowserClient();
    const result = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setNotice(isSignUp ? "Sign-up failed. Check your details and try again." : "Sign-in failed. Check your email and password.");
      setIsSubmitting(false);
      return;
    }

    if (isSignUp && !result.data.session) {
      setNotice("Account created. Check your email to confirm your account before signing in.");
      setIsSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function continueWithGoogle() {
    setIsSubmitting(true);
    setNotice("");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setNotice("Google authentication is unavailable. Check the Supabase provider configuration.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submitPasswordAuth}>
        <p className="eyebrow">SENTINEL</p>
        <h1>{isSignUp ? "Create your workspace account" : "Sign in to your workspace"}</h1>
        <p className="subheading">Authenticate before managing projects or starting test runs.</p>
        <label>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Create account" : "Sign in")}
        </button>
        <div className="auth-divider"><span>or</span></div>
        <button className="outline-button auth-google-button" type="button" disabled={isSubmitting} onClick={continueWithGoogle}>
          Continue with Google
        </button>
        {notice && <p className="form-notice" role="alert">{notice}</p>}
        <p className="auth-switch">
          {isSignUp ? "Already have an account?" : "New to Sentinel?"}{" "}
          <a href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</a>
        </p>
      </form>
    </main>
  );
}

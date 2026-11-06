"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [token, setToken] = useState<string>();
  const [notice, setNotice] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    let active = true;
    void params.then((value) => {
      if (active) setToken(value.token);
    });
    return () => {
      active = false;
    };
  }, [params]);

  async function acceptInvite() {
    if (!token) return;
    setIsAccepting(true);
    setNotice("");
    try {
      const response = await fetch(`/api/team/invites/${token}/accept`, { method: "POST" });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to accept invite.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to accept invite.");
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <main className="landing-page invite-page">
      <header className="landing-nav">
        <Link className="landing-brand" href="/"><span className="brand-mark">✦</span><span><strong>Sentinel</strong><small>AI quality control</small></span></Link>
      </header>
      <section className="invite-card">
        <p className="eyebrow">WORKSPACE INVITATION</p>
        <h1>Join your Sentinel team.</h1>
        <p>Sign in with the invited email address, then accept this invitation to access the team’s projects and test runs.</p>
        <button className="primary-button" type="button" disabled={!token || isAccepting} onClick={acceptInvite}>{isAccepting ? "Joining..." : "Accept invitation →"}</button>
        <Link className="landing-secondary-action" href="/sign-in">Sign in first</Link>
        {notice && <p className="form-notice" role="status">{notice}</p>}
      </section>
    </main>
  );
}

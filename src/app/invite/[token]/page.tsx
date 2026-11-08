import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { OrgAvatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertIcon, ArrowRightIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { getSessionUser } from "@/server/auth/session";
import { inviteService } from "@/server/services/invite.service";
import { acceptInviteAction } from "./actions";

export const metadata: Metadata = { title: "Invitation" };

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <main className="flex min-h-dvh flex-col items-center px-5 py-6">
      <Logo className="self-start sm:self-center" />
      <div className="flex w-full max-w-md flex-1 items-center py-10">
        <Suspense fallback={<div className="h-72 w-full animate-pulse rounded-xl bg-surface-sunken" />}>
          <InviteCard params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function InviteCard({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const [preview, user] = await Promise.all([inviteService.preview(token), getSessionUser()]);

  if (preview.state === "invalid") {
    return (
      <Card className="w-full p-8 text-center">
        <AlertIcon className="mx-auto size-6 text-danger" />
        <h1 className="mt-4 text-xl font-semibold">This invitation can&apos;t be used</h1>
        <p className="mt-2 text-sm text-muted">It may have expired, been revoked, or already been accepted. Ask an admin for a new invite, or request to join with the organization ID.</p>
        <ButtonLink href="/onboarding" className="mt-6">Go to onboarding</ButtonLink>
      </Card>
    );
  }

  const returnTo = encodeURIComponent(`/invite/${token}`);
  const wrongAccount = user && user.email !== preview.email;

  return (
    <Card className="w-full p-8 text-center">
      <OrgAvatar name={preview.organization.name} className="mx-auto size-12 rounded-xl text-base" />
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand">You&apos;re invited</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance">Join {preview.organization.name} on Sentinel</h1>
      <p className="mt-2 text-sm text-muted">This invitation was sent to <span className="font-medium text-ink">{preview.email}</span>.</p>

      <div className="mt-7 grid gap-3">
        {!user && (
          <>
            <ButtonLink href={`/sign-up?next=${returnTo}`} size="lg">Create account to accept <ArrowRightIcon /></ButtonLink>
            <ButtonLink href={`/sign-in?next=${returnTo}`} size="lg" variant="secondary">I already have an account</ButtonLink>
          </>
        )}
        {user && !wrongAccount && (
          <ActionButton action={acceptInviteAction.bind(null, token)} variant="primary" size="lg" pendingLabel="Joining…" className="w-full">
            Accept and join <ArrowRightIcon />
          </ActionButton>
        )}
        {wrongAccount && (
          <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-left text-[13px] text-danger">
            You&apos;re signed in as <strong>{user.email}</strong>. Sign out and sign in as {preview.email} to accept.
          </div>
        )}
      </div>
    </Card>
  );
}

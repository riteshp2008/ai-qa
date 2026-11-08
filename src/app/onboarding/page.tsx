import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { CreateOrganizationForm } from "@/components/onboarding/create-organization-form";
import { JoinOrganizationForm } from "@/components/onboarding/join-organization-form";
import { JoinRequestList } from "@/components/onboarding/join-request-list";
import { UserMenu } from "@/components/shell/user-menu";
import { OrgAvatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRightIcon, BuildingIcon, UsersIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { requireUser } from "@/server/auth/session";
import { joinRequestService } from "@/server/services/join-request.service";
import { organizationService } from "@/server/services/organization.service";

export const metadata: Metadata = { title: "Set up your organization" };

export default function OnboardingPage() {
  return (
    <div className="min-h-dvh">
      <Suspense fallback={<OnboardingSkeleton />}>
        <OnboardingContent />
      </Suspense>
    </div>
  );
}

async function OnboardingContent() {
  await connection();
  const user = await requireUser("/onboarding");
  const [memberships, requests] = await Promise.all([
    organizationService.listForUser(user.id),
    joinRequestService.listForUser(user.id),
  ]);
  const firstName = user.name?.split(" ")[0];

  return (
    <>
      <header className="flex items-center justify-between border-b border-line bg-surface/80 px-5 py-3 backdrop-blur sm:px-8">
        <Logo href="/onboarding" />
        <UserMenu user={user} />
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Step 1 of 3 · Organization</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {firstName ? `Welcome, ${firstName}.` : "Welcome to Sentinel."} Where will you work?
          </h1>
          <p className="mt-3 text-[15px] text-muted text-pretty">
            Everything in Sentinel — projects, GitHub repositories, and test runs — belongs to an organization.
            Start a new one or ask to join your team&apos;s.
          </p>
        </div>

        {memberships.length > 0 && (
          <Card className="mx-auto mt-10 max-w-2xl">
            <p className="border-b border-line px-5 py-3 text-[13px] font-medium text-muted">You already belong to</p>
            <ul className="divide-y divide-line">
              {memberships.map(({ organization, role }) => (
                <li key={organization.id}>
                  <Link href={`/o/${organization.slug}`} className="group flex items-center gap-3 px-5 py-3 transition hover:bg-surface-muted">
                    <OrgAvatar name={organization.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{organization.name}</span>
                      <span className="block font-mono text-xs text-muted">{organization.slug}</span>
                    </span>
                    <RoleBadge role={role} />
                    <ArrowRightIcon className="text-subtle transition group-hover:translate-x-0.5 group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <ChoiceCard
            icon={<BuildingIcon />}
            title="Create an organization"
            description="You'll be the owner. Invite teammates or approve their requests later."
          >
            <CreateOrganizationForm />
          </ChoiceCard>
          <ChoiceCard
            icon={<UsersIcon />}
            title="Join an existing organization"
            description="Enter your team's organization ID. Its owners and admins get an email to approve you."
          >
            <JoinOrganizationForm />
          </ChoiceCard>
        </div>

        <div className="mt-8">
          <JoinRequestList requests={requests} now={new Date()} />
        </div>
      </main>
    </>
  );
}

function ChoiceCard({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col p-6">
      <div className="mb-5 flex items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink [&_svg]:size-5">{icon}</span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-0.5 text-[13px] text-muted text-pretty">{description}</p>
        </div>
      </div>
      <div className="mt-auto">{children}</div>
    </Card>
  );
}

function OnboardingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-5 py-20 sm:px-8">
      <div className="mx-auto h-9 max-w-md rounded-lg bg-surface-sunken" />
      <div className="mx-auto mt-4 h-4 max-w-lg rounded bg-surface-sunken" />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="h-80 rounded-xl bg-surface-sunken" />
        <div className="h-80 rounded-xl bg-surface-sunken" />
      </div>
    </div>
  );
}

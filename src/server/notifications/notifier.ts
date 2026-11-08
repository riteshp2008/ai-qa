import "server-only";

import { after } from "next/server";

import { getAppUrl } from "@/lib/config";
import { sendEmail } from "@/lib/email/transport";
import { joinRequestRepository } from "@/server/repositories/join-request.repository";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { inviteEmail, joinRequestCreatedEmail, joinRequestDecidedEmail } from "./templates";

/**
 * Runs a notification after the response is sent so slow email providers never
 * block the user. Failures are logged, never surfaced: the in-app state (e.g. the
 * pending request on the members page) is the source of truth, email is a nudge.
 */
function deliverInBackground(label: string, task: () => Promise<void>) {
  after(async () => {
    try {
      await task();
    } catch (error) {
      console.error(`Notification "${label}" failed.`, error);
    }
  });
}

export const notifier = {
  joinRequestCreated(input: { requestId: string; requester: { email: string; name: string | null } }) {
    deliverInBackground("join-request.created", async () => {
      const request = await joinRequestRepository.findById(input.requestId);
      if (!request) return;
      const [organization, reviewers] = await Promise.all([
        organizationRepository.findById(request.organizationId),
        organizationRepository.listReviewerEmails(request.organizationId),
      ]);
      if (!organization || reviewers.length === 0) return;

      await sendEmail({
        to: reviewers,
        ...joinRequestCreatedEmail({
          requesterEmail: input.requester.email,
          requesterName: input.requester.name,
          organizationName: organization.name,
          message: request.message,
          reviewUrl: `${getAppUrl()}/o/${organization.slug}/members`,
        }),
      });
    });
  },

  joinRequestDecided(input: { requesterEmail: string; organization: { name: string; slug: string }; approved: boolean }) {
    deliverInBackground("join-request.decided", () =>
      sendEmail({
        to: input.requesterEmail,
        ...joinRequestDecidedEmail({
          organizationName: input.organization.name,
          approved: input.approved,
          url: input.approved ? `${getAppUrl()}/o/${input.organization.slug}` : `${getAppUrl()}/onboarding`,
        }),
      }),
    );
  },

  inviteCreated(input: { email: string; organizationName: string; inviterEmail: string; inviteUrl: string }) {
    deliverInBackground("invite.created", () =>
      sendEmail({ to: input.email, ...inviteEmail(input) }),
    );
  },
};

import type { EmailMessage } from "@/lib/email/transport";

type Content = Omit<EmailMessage, "to">;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

function layout(heading: string, paragraphs: string[], action: { label: string; url: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6">${p}</p>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:32px">
<tr><td>
<p style="margin:0 0 24px;font-weight:600;color:#0f766e;font-size:14px;letter-spacing:.02em">✦ Sentinel</p>
<h1 style="margin:0 0 16px;font-size:20px;color:#0f172a">${heading}</h1>
${body}
<a href="${escapeHtml(action.url)}" style="display:inline-block;margin-top:8px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:9px">${escapeHtml(action.label)}</a>
<p style="margin:28px 0 0;color:#94a3b8;font-size:12px">If the button doesn't work, open this link: ${escapeHtml(action.url)}</p>
</td></tr></table></td></tr></table></body></html>`;
}

export function joinRequestCreatedEmail(input: {
  requesterEmail: string;
  requesterName: string | null;
  organizationName: string;
  message: string | null;
  reviewUrl: string;
}): Content {
  const who = input.requesterName ? `${input.requesterName} (${input.requesterEmail})` : input.requesterEmail;
  const org = input.organizationName;
  return {
    subject: `${input.requesterName ?? input.requesterEmail} wants to join ${org}`,
    text: `${who} asked to join ${org} on Sentinel.${input.message ? `\n\nTheir note: "${input.message}"` : ""}\n\nReview the request: ${input.reviewUrl}`,
    html: layout(
      `New request to join ${escapeHtml(org)}`,
      [
        `<strong>${escapeHtml(who)}</strong> asked to join <strong>${escapeHtml(org)}</strong>.`,
        ...(input.message ? [`<em>“${escapeHtml(input.message)}”</em>`] : []),
        "Owners and admins can approve or decline the request from the members page.",
      ],
      { label: "Review request", url: input.reviewUrl },
    ),
  };
}

export function joinRequestDecidedEmail(input: {
  organizationName: string;
  approved: boolean;
  url: string;
}): Content {
  const org = input.organizationName;
  return input.approved
    ? {
        subject: `You're in — welcome to ${org}`,
        text: `Your request to join ${org} on Sentinel was approved.\n\nOpen the organization: ${input.url}`,
        html: layout(`Welcome to ${escapeHtml(org)}`, ["Your request to join was approved. You now have access to the organization's projects and test runs."], { label: "Open organization", url: input.url }),
      }
    : {
        subject: `Your request to join ${org} was declined`,
        text: `An admin of ${org} declined your request to join. You can create your own organization or ask an admin for an invite.\n\n${input.url}`,
        html: layout("Request declined", [`An admin of <strong>${escapeHtml(org)}</strong> declined your request. You can create your own organization or ask an admin for an invite.`], { label: "Go to Sentinel", url: input.url }),
      };
}

export function inviteEmail(input: { organizationName: string; inviterEmail: string; inviteUrl: string }): Content {
  const org = input.organizationName;
  return {
    subject: `You're invited to join ${org} on Sentinel`,
    text: `${input.inviterEmail} invited you to join ${org} on Sentinel. The link expires in 7 days.\n\nAccept: ${input.inviteUrl}`,
    html: layout(`Join ${escapeHtml(org)} on Sentinel`, [`<strong>${escapeHtml(input.inviterEmail)}</strong> invited you to collaborate. The invitation expires in 7 days.`], { label: "Accept invitation", url: input.inviteUrl }),
  };
}

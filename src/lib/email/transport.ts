import "server-only";

import { getEmailConfig } from "@/lib/config";

export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

/**
 * Delivers a transactional email through Resend's HTTP API. Without a
 * RESEND_API_KEY (local development) the message is logged instead, so the
 * rest of the flow keeps working.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const { resendApiKey, from } = getEmailConfig();
  const recipients = Array.isArray(message.to) ? message.to : [message.to];
  if (recipients.length === 0) return;

  if (!resendApiKey) {
    console.info(`[email:dev] to=${recipients.join(", ")} subject="${message.subject}"\n${message.text}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: recipients, subject: message.subject, html: message.html, text: message.text }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Email delivery failed with status ${response.status}: ${detail.slice(0, 300)}`);
  }
}

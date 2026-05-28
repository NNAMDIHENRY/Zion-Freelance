import "server-only";

import { escapeHtml } from "@/lib/notifications/email/provider";

export type EmailTemplateInput = {
  recipientName: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export function renderNotificationEmail(input: EmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = input.title;
  const cta =
    input.ctaLabel && input.ctaUrl
      ? `<p style="margin:24px 0"><a href="${escapeHtml(input.ctaUrl)}" style="background:#0f172a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${escapeHtml(input.ctaLabel)}</a></p>`
      : "";

  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a"><p>Hi ${escapeHtml(input.recipientName)},</p><p><strong>${escapeHtml(input.title)}</strong></p><p>${escapeHtml(input.body)}</p>${cta}<p style="color:#64748b;font-size:13px;margin-top:32px">You received this because of your notification preferences on Zion TeCHer.</p></div>`;

  const text = [
    `Hi ${input.recipientName},`,
    "",
    input.title,
    input.body,
    input.ctaUrl ? `\n${input.ctaLabel ?? "View"}: ${input.ctaUrl}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

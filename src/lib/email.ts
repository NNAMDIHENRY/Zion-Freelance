import { renderNotificationEmail } from "@/lib/notifications/email/templates";
import { sendTransactionalEmail } from "@/lib/notifications/email/provider";

export async function sendVerificationEmail(params: {
  to: string;
  verifyUrl: string;
  name: string;
}): Promise<void> {
  const rendered = renderNotificationEmail({
    recipientName: params.name,
    title: "Verify your email",
    body: "Confirm your email to access your Zion Workspace account. This link expires in 24 hours.",
    ctaLabel: "Verify email",
    ctaUrl: params.verifyUrl
  });

  await sendTransactionalEmail({
    to: params.to,
    subject: "Verify your email address",
    html: rendered.html,
    text: rendered.text
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  name: string;
}): Promise<void> {
  const rendered = renderNotificationEmail({
    recipientName: params.name,
    title: "Reset your password",
    body: "We received a request to reset your password. The link below is valid for one hour.",
    ctaLabel: "Reset password",
    ctaUrl: params.resetUrl
  });

  await sendTransactionalEmail({
    to: params.to,
    subject: "Reset your password",
    html: rendered.html.replace(
      "You received this because of your notification preferences on Zion TeCHer.",
      "If you did not request this, you can ignore this email."
    ),
    text: rendered.text
  });
}

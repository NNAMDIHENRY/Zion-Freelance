const RESEND_API = "https://api.resend.com/emails";

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  name: string;
}): Promise<void> {
  const { to, resetUrl, name } = params;
  const from =
    process.env.EMAIL_FROM ?? "Zion TeCHer <onboarding@resend.dev>";
  const subject = "Reset your password";
  const html = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>We received a request to reset your password. Click the link below (valid for one hour):</p>
    <p><a href="${escapeHtml(resetUrl)}">Reset password</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html
      })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Resend error ${res.status}: ${text}`);
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    // Never log reset links in production without a mail provider.
    // eslint-disable-next-line no-console
    console.info("[email:dev] Password reset link", { to, resetUrl });
    return;
  }

  throw new Error(
    "Email is not configured. Set RESEND_API_KEY and EMAIL_FROM for production."
  );
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

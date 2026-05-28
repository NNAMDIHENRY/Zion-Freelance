import "server-only";

const RESEND_API = "https://api.resend.com/emails";

export type TransactionalEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendTransactionalEmail(
  payload: TransactionalEmailPayload
): Promise<void> {
  const from =
    process.env.EMAIL_FROM ?? "Zion TeCHer <onboarding@resend.dev>";
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
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text
      })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Email provider error ${res.status}: ${text}`);
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[email:dev]", {
      to: payload.to,
      subject: payload.subject
    });
    return;
  }

  throw new Error(
    "Email is not configured. Set RESEND_API_KEY and EMAIL_FROM for production."
  );
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

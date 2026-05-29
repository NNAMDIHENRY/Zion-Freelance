import "server-only";

function readEnv(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v && v.length > 0 ? v : undefined;
}

export const paymentEnv = {
  flutterwaveSecretKey: readEnv("FLUTTERWAVE_SECRET_KEY"),
  flutterwavePublicKey: readEnv("FLUTTERWAVE_PUBLIC_KEY"),
  flutterwaveEncryptionKey: readEnv("FLUTTERWAVE_ENCRYPTION_KEY"),
  flutterwaveWebhookSecret: readEnv("FLUTTERWAVE_WEBHOOK_SECRET"),
  flutterwaveBaseUrl: readEnv("FLUTTERWAVE_BASE_URL") ?? "https://api.flutterwave.com/v3",
  appUrl: readEnv("NEXTAUTH_URL") ?? readEnv("APP_URL")
} as const;

export function assertFlutterwaveEnv() {
  const secret = paymentEnv.flutterwaveSecretKey;
  const webhook = paymentEnv.flutterwaveWebhookSecret;
  const appUrl = paymentEnv.appUrl;
  if (!secret) {
    throw new Error("Payments misconfigured: set FLUTTERWAVE_SECRET_KEY");
  }
  if (!webhook) {
    throw new Error("Payments misconfigured: set FLUTTERWAVE_WEBHOOK_SECRET");
  }
  if (!appUrl) {
    throw new Error("Payments misconfigured: set NEXTAUTH_URL or APP_URL");
  }
  return { secret, webhook, appUrl };
}

export function isFlutterwaveConfigured(): boolean {
  return Boolean(
    paymentEnv.flutterwaveSecretKey &&
    paymentEnv.flutterwavePublicKey &&
    paymentEnv.flutterwaveEncryptionKey &&
    paymentEnv.flutterwaveWebhookSecret &&
    paymentEnv.appUrl
  );
}
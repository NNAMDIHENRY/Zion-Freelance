/**
 * Validates required environment variables at startup.
 * Logs warnings in development; throws in production for critical missing vars.
 */

const REQUIRED_PRODUCTION = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL"
] as const;

const RECOMMENDED_PRODUCTION = [
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "FLUTTERWAVE_SECRET_KEY",
  "FLUTTERWAVE_WEBHOOK_SECRET"
] as const;

export function validateEnv(): { ok: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];
  const isProd = process.env.NODE_ENV === "production";

  for (const key of REQUIRED_PRODUCTION) {
    if (!process.env[key]?.trim()) missing.push(key);
  }

  if (isProd) {
    for (const key of RECOMMENDED_PRODUCTION) {
      if (!process.env[key]?.trim()) warnings.push(key);
    }
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
      warnings.push("NEXTAUTH_SECRET (should be at least 32 characters)");
    }
  }

  if (isProd && missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (warnings.length && isProd) {
    console.warn("[env] Recommended variables not set:", warnings.join(", "));
  }

  return { ok: missing.length === 0, missing, warnings };
}

export const env = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL:
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
} as const;

export function assertAuthEnv(): { secret: string; url: string } {
  const secret = env.NEXTAUTH_SECRET;
  const url = env.NEXTAUTH_URL;
  if (!secret || !url) {
    throw new Error("Auth misconfigured: set NEXTAUTH_SECRET and NEXTAUTH_URL");
  }
  return { secret, url };
}


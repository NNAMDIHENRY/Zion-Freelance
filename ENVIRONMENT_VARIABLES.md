# Environment Variables — Zion TeCHer Freelance

## Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public` |
| `NEXTAUTH_SECRET` | JWT/session signing secret (≥32 chars) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical app URL (no trailing slash) | `https://app.example.com` |

## Email (production)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `RESEND_API_KEY` | Recommended | Resend API key | `re_...` |
| `EMAIL_FROM` | Recommended | Verified sender | `Zion <noreply@example.com>` |

Without Resend, password-reset emails log to console in development only.

## Payments — Flutterwave

| Variable | Required | Description |
|----------|----------|-------------|
| `FLUTTERWAVE_SECRET_KEY` | Production | Server API secret |
| `FLUTTERWAVE_PUBLIC_KEY` | Production | Client checkout key |
| `FLUTTERWAVE_ENCRYPTION_KEY` | Production | Card encryption |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Production | Webhook signature verification |
| `FLUTTERWAVE_BASE_URL` | Optional | Default `https://api.flutterwave.com/v3` |

## Optional

| Variable | Description |
|----------|-------------|
| `AUTH_TRUST_HOST` | Set `true` behind reverse proxies if callback URL issues |
| `NODE_ENV` | `production` in live environments |

## Security notes

- Never commit `.env` or real secrets to git.
- Rotate `NEXTAUTH_SECRET` only with a planned session logout (invalidates sessions).
- Use separate Flutterwave sandbox vs live keys per environment.
- Restrict database credentials to application subnet / IP allowlist.
- Webhook endpoint must use HTTPS in production.

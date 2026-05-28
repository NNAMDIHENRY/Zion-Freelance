# Production Checklist — Zion TeCHer Freelance

## Pre-launch

- [ ] All environment variables set (see `ENVIRONMENT_VARIABLES.md`)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Prisma migrations applied on production DB
- [ ] Taxonomy synced (`GET /api/taxonomy` or deploy hook)
- [ ] Flutterwave live keys + webhook URL configured
- [ ] Resend domain verified; `EMAIL_FROM` matches verified sender
- [ ] `NEXTAUTH_URL` matches production domain (HTTPS)
- [ ] `NEXTAUTH_SECRET` ≥ 32 random bytes

## QA

- [ ] Register / login / logout (client + freelancer)
- [ ] Post project → receive proposal → accept → contract created
- [ ] Milestone setup, escrow fund, submit → approve → release
- [ ] Messaging and file uploads
- [ ] Wallet, withdrawal request (admin approval)
- [ ] Notifications (in-app + email where enabled)
- [ ] Landing search → results page
- [ ] Mobile/tablet layout on dashboard and marketing pages
- [ ] Dark mode sidebar readable

## Security

- [ ] No secrets in git; `.env` local only
- [ ] Admin routes blocked for non-admin roles
- [ ] API routes return 401 without session where required
- [ ] Rate limits on auth, contact, marketplace search, taxonomy
- [ ] Security headers active (see `next.config.mjs`)
- [ ] Webhook signature verification enabled (Flutterwave)

## Deployment

- [ ] Database backup before migration
- [ ] Run `prisma migrate deploy`
- [ ] Smoke test auth callback after deploy
- [ ] Verify webhook endpoint publicly reachable

## Monitoring

- [ ] Error logging (hosting provider / Sentry)
- [ ] Uptime check on `/` and `/api/auth/session`
- [ ] Payment webhook failure alerts
- [ ] DB connection pool / latency monitoring

## Backup

- [ ] Automated daily PostgreSQL backups
- [ ] Backup restore tested quarterly
- [ ] Upload storage backed up if using local `.uploads` (prefer object storage in production)

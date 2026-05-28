# Deployment Guide — Zion TeCHer Freelance

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Domain with HTTPS

## Environment setup

1. Copy `.env.example` to `.env` (local) or configure host env vars (production).
2. Fill all required variables — see `ENVIRONMENT_VARIABLES.md`.

## Database setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Apply migrations (production)
npx prisma migrate deploy
```

Optional: seed taxonomy on first deploy:

```bash
curl https://your-domain.com/api/taxonomy
```

## Local development

```bash
npm run dev
```

## Production build

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

## Vercel deployment

1. Import repository; set framework preset **Next.js**.
2. Add environment variables from `ENVIRONMENT_VARIABLES.md`.
3. Set build command: `npm run build`.
4. Add `DATABASE_URL` from managed Postgres (Neon, Supabase, etc.).
5. Run migrations via CI or one-off: `npx prisma migrate deploy`.
6. Set `NEXTAUTH_URL` to `https://your-domain.com`.
7. Configure Flutterwave webhook: `https://your-domain.com/api/webhooks/flutterwave`.

## Post-deployment verification

- [ ] Homepage loads; hero search returns suggestions
- [ ] Login/register works; session persists
- [ ] Create test contract milestone flow
- [ ] Flutterwave test payment (sandbox) then live
- [ ] Email reset link received (Resend)
- [ ] `robots.txt` and `sitemap.xml` accessible

## Troubleshooting

| Issue | Fix |
|-------|-----|
| NextAuth callback mismatch | Set `NEXTAUTH_URL` exactly; enable `AUTH_TRUST_HOST=true` on Vercel if needed |
| Prisma connection errors | Check `DATABASE_URL`, SSL mode, IP allowlist |
| Build TypeScript errors | Run `npm run typecheck` locally before deploy |
| Webhooks 401/400 | Verify `FLUTTERWAVE_WEBHOOK_SECRET` |

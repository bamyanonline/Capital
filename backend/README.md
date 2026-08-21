# CAPITAL Cloudflare Backend

This backend is a Cloudflare Worker with Cloudflare D1. The project root is `capital/`.

## Local validation

```bash
npm install
npm run check
npm test
```

## D1

1. Create a D1 database in Cloudflare named `capital-prod-db`.
2. Copy its database ID into `wrangler.jsonc`.
3. Apply migrations:

```bash
npm run migrate:remote
```

## Secrets / variables

Set these as Worker variables/secrets, not in Git:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `PUBLIC_BASE_URL`
- `ALLOWED_ORIGIN`
- `RESEND_API_KEY` (secret, optional but recommended for password reset email)
- `RESEND_FROM`

`DB` is a D1 binding and is configured in `wrangler.jsonc`.

## Deployment

```bash
npm install
npm test
npm run check
npx wrangler deploy
```

The scheduled job is `30 19 * * *` UTC, which is 00:00 Afghanistan time (Asia/Kabul). It expires old pending withdrawals and runs the daily profit/team-profit engine exactly once per Afghanistan financial date.

# CAPITAL — Cloudflare Deployment Plan

## Repository root

Use `capital/` as the GitHub repository root. Do not keep `Capitalv3/` as an extra nested root.

## Architecture

- GitHub: source control
- Cloudflare Worker: API + financial engine + same-origin static delivery
- Cloudflare D1: normalized production database
- Worker Assets: `backend/public/` containing deployment copies of `frontend/` and `admin/`

## D1

Create a D1 database named `capital-prod-db`, then place its real `database_id` in `backend/wrangler.jsonc`.

Apply migrations from `backend/migrations/` before first deployment.

## Secrets

Set in Cloudflare Worker settings:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `PUBLIC_BASE_URL`
- `ALLOWED_ORIGIN`
- `RESEND_API_KEY` (Secret; optional for reset email but recommended)
- `RESEND_FROM`

Never commit real credentials.

## Build/deploy

From `capital/backend`:

```bash
npm ci
npm test
npm run check
npx wrangler d1 migrations apply capital-prod-db --remote
npx wrangler deploy
```

The D1 binding is named `DB`.

## Daily schedule

Cloudflare Cron is UTC. The project uses `30 19 * * *`, which corresponds to 00:00 in `Asia/Kabul`.

The scheduled handler is idempotent by the `system_meta.last_daily_run` financial date. It expires pending withdrawals from previous Afghanistan financial days and then posts Daily Profit and Direct Team Profit once per user/date/member.

## First deployment safety

Do not point this Worker at a live database until the migration is applied to a test D1 database and the following cases are verified:

- 100/200/300/400/500 exact deposits
- Deposit before and after 16:00 Afghanistan time
- Same-day and later-day admin approval
- 5% inviter-only referral bonus
- pre-30-day reversal and post-30-day non-reversal
- 0.1% direct team profit
- 100% cap and exact 3x threshold
- 1500 team capital for a 500 principal
- next-00:00 reactivation
- negative Available Balance and subsequent income offset
- 10% withdrawal fee
- 20 USDT minimum Available Balance reserve
- 10% of principal minimum withdrawal
- one withdrawal request per Afghanistan day
- pending withdrawal expiration at 00:00
- Delete vs Suspended/Blocked history behavior
- duplicate daily-job execution

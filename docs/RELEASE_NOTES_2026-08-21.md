# CAPITAL Production Fixes — 2026-08-21

This release is a production-hardening revision focused on the previously identified financial, security, Admin UI, and Cloudflare Pages deployment issues.

## Financial and state-machine fixes

- Direct team capital counts only active direct members with investment.
- No-Cap activation is evaluated by the daily financial job; the projected threshold does not silently bypass the persisted state during an intraday page request.
- Daily profit eligibility after deposit approval is calculated from the later of the deposit eligibility day and the day after Admin approval, preventing retroactive same-day/back-pay profit.
- Profit and team-profit processing ignores inactive members.
- Withdrawal approval is distinct from blockchain completion.
- Blockchain failure reverses the financial effect of the failed withdrawal and can restore profit only when that withdrawal itself caused the stop state.
- Withdrawal rejection and approval updates are tied to the claimed processing nonce to reduce concurrent-admin race conditions.
- Pending/approved/processing withdrawals are treated as reserved funds when calculating truly withdrawable balance.
- Fixed financial rules are server-side constants and are no longer mutable from Admin settings.
- Referral reversal is allowed to create a negative Available/Balance state instead of silently hiding a shortfall.
- Deleted users are represented as a permanent soft-delete state using `blocked` + `deleted_at`; they cannot be reactivated.

## Deposit verification

- Deposit approval now requires server-side TRC20/USDT verification through the configured TronScan API key.
- TXID format is validated.
- Verification checks confirmation state, transaction hash, recipient, USDT TRC20 contract, token, decimals and exact amount.
- Admin cannot mark an unverified deposit as approved merely by clicking Approve.

## Admin fixes

- Review Cancel no longer means Reject; rejection requires a reason.
- User search is functional.
- Announcement publishing is functional.
- User wallet address is visible on the Admin user page.
- Financial settings are explicitly read-only because the business rules are fixed.

## Cloudflare Pages

- Added `functions/api/[[path]].js` to proxy browser `/api/*` requests from Pages to the Worker.
- Added Pages security headers in `frontend/_headers`.
- Frontend uses relative `/api/...` calls, keeping credentials on the Pages origin.
- `backend/public/` is synchronized from the canonical `frontend/` and `admin/` directories.
- Bundled inspection credentials are disabled by migration `0009_disable_bundled_access.sql`.

## Verification performed

- D1 migrations 0001–0009 executed successfully on a clean SQLite database.
- `PRAGMA foreign_key_check` returned no violations.
- Root `npm run verify` passed: 35/35 tests.
- Worker syntax check passed.
- Admin, frontend API, frontend application, and Pages Function JavaScript syntax checks passed.

## Production prerequisites

Before enabling real-money operation, configure the actual Cloudflare secrets/variables described in `docs/DEPLOYMENT.md`. In particular, a trusted withdrawal broadcaster must call the protected internal confirmation/failure endpoints; this repository deliberately does not store a wallet signing key or falsely complete withdrawals without an external confirmed broadcast.

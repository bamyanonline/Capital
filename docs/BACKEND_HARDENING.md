# CAPITAL Backend v24.1.0 — Deep Hardening Report

## Preserved
- Existing Frontend/Admin UI and their API contract.
- Existing VIP amounts and daily-profit rules.
- Referral rate, team rate, 3x cap logic and 20 USDT reserve.
- Existing authentication endpoints and Cloudflare Worker/D1 architecture.

## Hardened
1. Strict Origin/CORS handling: no arbitrary `Origin` reflection when `ALLOWED_ORIGIN` is absent.
2. Secure cookies on HTTPS with `Secure`, `HttpOnly`, `SameSite=Lax`.
3. Session sliding expiration and invalid-session cleanup.
4. Admin session sliding expiration.
5. Login/register/password-reset rate limiting backed by D1.
6. Preferred `ADMIN_PASSWORD_HASH` support with legacy password fallback for compatibility.
7. Request body size limits.
8. Optional `Idempotency-Key` support for deposits and withdrawals.
9. Database uniqueness for one withdrawal per user per financial date.
10. Atomic, nonce-guarded withdrawal approval/rejection.
11. Atomic, nonce-guarded deposit approval with ledger-first financial writes.
12. Ledger uniqueness for major financial events.
13. Daily income writes are idempotent even when the scheduled job retries.
14. Safer referral reversal and no negative balances from reversal logic.
15. Cap-state evaluation avoids resetting cap usage during concurrent evaluations.
16. Soft-delete for users so financial/audit history is not physically deleted.
17. KYC API foundation with private R2 object storage support.
18. KYC file validation, ownership checks, and admin review endpoints.
19. Cleanup of expired reset tokens and old auth-attempt records.
20. Private/no-store response headers and HSTS.

## New migration
`backend/migrations/0004_backend_hardening.sql`

## KYC storage
See `backend/R2_KYC_SETUP.md`.

## Validation performed
- `node --check backend/worker.js` — passed.
- `npm test` — 12/12 tests passed.
- All four SQL migrations executed successfully against SQLite in-memory validation.

## Production dependencies still requiring external configuration
- Cloudflare D1 production database ID.
- Private R2 bucket bound as `KYC_BUCKET`.
- `ADMIN_PASSWORD_HASH` and other secrets.
- Verified TRON/TRC20 deposit verification provider.
- Controlled withdrawal signing/broadcast service.
- Monitoring/alerting.

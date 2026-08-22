# CAPV1 — Production Hardening Release

## Financial fixes

- Withdrawal and deposit cutoffs are evaluated to the exact second in `Asia/Kabul`.
- `NO_CAP` transitions are recorded immediately but become withdrawal-effective at the next financial-day boundary, matching the financial specification.
- Cap-cycle usage is preserved during the pending `NO_CAP` transition and reset only when the new cycle becomes effective.
- Direct-team investment approval and removal trigger immediate cap-state re-evaluation for the inviter.
- Withdrawal approval now claims the withdrawal row before dependent user mutations, preventing an order-of-operations race.
- Referral reversals are allowed to make Available Balance negative as required by the financial specification.
- Login/register/reset rate limiting now uses an atomic insert condition instead of a check-then-insert race.

## Integrity and audit

- Added `financial_job_runs` for daily-job lifecycle, recovery and observability.
- Added `reconciliation_issues` and a scheduled ledger-vs-balance reconciliation pass.
- Added `wallet_change_history` for permanent wallet audit history.
- Added Admin reconciliation endpoint for job runs and open financial mismatches.
- Direct-team hierarchy display now uses a recursive SQL query instead of repeated per-node queries.

## Frontend / Admin architecture

- Customer UI has one CSS source of truth: `frontend/assets/style.css`.
- Admin UI has one CSS source of truth: `admin/assets/admin.css`.
- Removed the remaining inline `<style>` block from the Profile page.
- Generated `backend/public/frontend` and `backend/public/admin` remain deployment copies only.
- Added `scripts/verify-ui-architecture.mjs` to prevent CSS drift and inline style blocks.
- Admin "View site" links now point to the configured customer Pages origin instead of repository-relative paths.
- Deployment documentation now describes separate customer and admin static surfaces.

## Verification

- 39 automated tests pass.
- Worker syntax check passes.
- UI architecture verification passes.
- All 10 SQL migrations pass a SQLite smoke test.

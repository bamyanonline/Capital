# CAPITAL Cloudflare Deployment

## 1. GitHub
Upload the repository root exactly as this project is structured. Do not upload `.dev.vars`, `.env`, private keys, API tokens or wallet signing keys.

## 2. Install
From the repository root:

```bash
npm --prefix backend install
```

## 3. Authenticate Wrangler

```bash
npx --prefix backend wrangler login
```

## 4. Create D1

```bash
npx --prefix backend wrangler d1 create capital-db
```

Copy the returned `database_id` into `backend/wrangler.jsonc`. Keep the binding name `DB` unchanged.

## 5. Apply migrations

```bash
npm run sync:public
npm run migrate:remote
```

Check the migration state:

```bash
npx --prefix backend wrangler d1 migrations list capital-db --remote
```

## 6. Configure production secrets

Use Cloudflare Worker secrets/environment configuration. Never put real secrets in Git.

Required production secrets/variables:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH` — PBKDF2 hash only; plaintext `ADMIN_PASSWORD` is not accepted.
- `DEPOSIT_ADDRESS` — the TRC20/USDT receiving address.
- `TRONSCAN_API_KEY` — required for server-side verification of every deposit TXID before approval.
- `BLOCKCHAIN_PROVIDER_SECRET` — secret used by the trusted withdrawal broadcaster callback.
- `RESEND_API_KEY` and `RESEND_FROM` if password-reset email is enabled.

Legacy bundled inspection accounts are removed by migration `0011_remove_legacy_access.sql`.

## 7. Verify and deploy

```bash
npm run verify
npm run deploy
```

## 8. Frontend Pages deployment

The customer frontend is hosted by the Cloudflare Pages project `capitalism`. The repository root contains a Pages Function at `functions/api/[[path]].js` that proxies `/api/*` to the `capital-api` Worker. This keeps the browser on the Pages origin while the API remains a separate Worker. Cloudflare Pages Functions use file-based routing, and a double-bracket route matches multiple path segments.

For the Pages project, use `frontend/` as the static build/output directory and deploy the repository root so the `functions/` directory is included. Set the Pages environment variable `CAPITAL_API_ORIGIN` to:

```text
https://capital-api.bamyanonline.workers.dev
```

The frontend calls `/api/...` relatively; it must not call the Worker URL directly from browser JavaScript.

## 8b. Admin Pages deployment

The admin console is a separate static surface and should be deployed from `admin/` as its own Cloudflare Pages project or equivalent protected static host. Do not mount it below the customer site's `/frontend` path in production. Configure its API calls through the same relative `/api/*` path and proxy them to the same Worker, while keeping the admin origin explicitly allow-listed in the Worker deployment if a separate origin is used. The `View site` navigation should point to the customer Pages origin, not a repository-relative `frontend/index.html` path.

## 9. Future source changes

Edit `frontend/`, `admin/`, or `functions/` as appropriate. Then run:

```bash
npm run sync:public
npm run verify
npm run deploy
```

This keeps the deployable static copy synchronized.


## 10. Financial production checks

Before opening deposits/withdrawals to users:

1. Confirm the Worker allow-list contains both `https://capitalism.pages.dev` and `https://capitalism-admin.pages.dev`.
2. Configure `TRONSCAN_API_KEY` and verify that a real testnet/mainnet USDT-TRC20 transaction can be detected and matched by TXID, recipient, contract, token, decimals, amount and confirmation status.
3. Configure a real withdrawal broadcaster that calls the protected `/api/internal/withdrawals/:id/confirm` or `/fail` endpoint. The API will never mark a withdrawal blockchain-complete merely because Admin clicked Approve.
4. Run `npm run verify` from the repository root.
5. Apply D1 migrations to staging first, then production.

The Pages Function at `functions/api/[[path]].js` keeps browser `/api/*` requests on the Pages origin while forwarding them server-to-server to the Worker. The frontend must continue to use relative `/api/...` URLs.


### Production URLs

- Customer: `https://capitalism.pages.dev`
- Admin: `https://capitalism-admin.pages.dev`
- API Worker: `https://capital-api.bamyanonline.workers.dev`

For the separate Admin Pages project, set the project root to `admin/` so `admin/functions/api/[[path]].js` and `admin/_routes.json` are included. For the customer Pages project, set the project root to `frontend/` and use the repository-level Pages Function when your Pages configuration supports it; otherwise deploy the repository root with the static output configured to `frontend/`.

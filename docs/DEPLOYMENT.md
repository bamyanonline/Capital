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

## 9. Future source changes

Edit `frontend/`, `admin/`, or `functions/` as appropriate. Then run:

```bash
npm run sync:public
npm run verify
npm run deploy
```

This keeps the deployable static copy synchronized.

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
npx --prefix backend wrangler d1 create capital-prod-db
```

Copy the returned `database_id` into `backend/wrangler.jsonc`. Keep the binding name `DB` unchanged.

## 5. Apply migrations

```bash
npm run sync:public
npm run migrate:remote
```

Check the migration state:

```bash
npx --prefix backend wrangler d1 migrations list capital-prod-db --remote
```

## 6. Configure production secrets

Use Cloudflare Worker secrets/environment configuration. Never put real secrets in Git.

## 7. Verify and deploy

```bash
npm run verify
npm run deploy
```

## 8. Future source changes

Edit only `frontend/` and `admin/`. Then run:

```bash
npm run sync:public
npm run verify
npm run deploy
```

This keeps the deployable static copy synchronized.

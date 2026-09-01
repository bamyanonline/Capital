# CAPITAL

CAPITAL is a Cloudflare Worker + D1 web application with a multilingual customer frontend and a bilingual English/Persian administration panel.

## Repository layout

```text
frontend/                 # canonical customer frontend
admin/                    # canonical admin frontend (English/Persian)
backend/
  worker.js               # Cloudflare Worker/API
  migrations/             # D1 migrations; never delete/reorder applied migrations
  public/                  # deployable copy generated from frontend/ and admin/
  tests/                   # backend and release tests
  wrangler.jsonc           # Cloudflare bindings/configuration
scripts/sync-public.mjs   # synchronizes canonical UI sources into backend/public
.github/workflows/        # CI
```

## Local verification

```bash
npm --prefix backend install
npm run verify
```

## Deploy

1. Create a Cloudflare D1 database and put its real `database_id` in `backend/wrangler.jsonc`.
3. Configure production secrets in Cloudflare.
4. Apply migrations with `npm run migrate:remote`.
5. Run `npm run verify`.
6. Run `npm run deploy`.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Important

Do not edit `backend/public` directly. It is a deployable synchronized copy. The canonical UI source is `frontend/` and `admin/`.

## Documentation

- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `docs/SECURITY.md`
- `docs/FINANCIAL_RULES.md`
- `docs/BACKEND_HARDENING.md`
- `docs/releases/V1.md`

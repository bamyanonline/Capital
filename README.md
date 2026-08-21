# CAPITAL

Cloudflare-ready project structure.

- `frontend/` — static user interface source
- `admin/` — static administrator interface source
- `backend/` — Cloudflare Worker + D1 migrations
- `FINANCIAL_RULES.md` — final business/financial specification
- `SECURITY.md` — security notes

## Cloudflare architecture

GitHub is the source of truth. Cloudflare Worker serves the API and the copied static assets in `backend/public/`. Cloudflare D1 stores normalized application data.

The `backend/public/frontend` and `backend/public/admin` directories are deployment copies of the corresponding source directories. Keep the source copies in sync when changing static files.

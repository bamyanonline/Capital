# CAPITAL Backend

The backend is a Cloudflare Worker API backed by D1.

- `worker.js`: API and business logic
- `migrations/`: immutable D1 migration history
- `tests/`: automated backend/release tests
- `public/`: synchronized deployment assets generated from the repository root sources
- `wrangler.jsonc`: Cloudflare Worker/D1 configuration

From the repository root:

```bash
npm --prefix backend install
npm run verify
npm run migrate:remote
npm run deploy
```

See `../docs/DEPLOYMENT.md` and `../docs/ARCHITECTURE.md`.

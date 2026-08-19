# Private KYC Storage (Cloudflare R2)

KYC files are intentionally **not** stored in `backend/public` and are never exposed as public assets.
The Worker expects a private R2 binding named `KYC_BUCKET`.

## 1. Create the bucket

```bash
npx wrangler r2 bucket create capital-kyc-private
```

## 2. Add the binding to `wrangler.jsonc`

Add this block to the top-level configuration after `d1_databases`:

```json
"r2_buckets": [
  {
    "binding": "KYC_BUCKET",
    "bucket_name": "capital-kyc-private"
  }
]
```

## 3. Security requirements

- Do **not** enable public access for the bucket.
- Do not put KYC files under `backend/public` or any static asset directory.
- Access is only through authenticated Admin endpoints.
- The Worker validates that a requested object key belongs to a registered KYC record.
- Uploads are limited to 5 MB per file and approved image/PDF MIME types.
- KYC objects are stored with `private, no-store` cache metadata.

## 4. Production recommendation

For a real deployment, add lifecycle/retention rules according to the applicable legal requirements and keep document access auditable.

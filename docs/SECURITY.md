# CAPITAL Security Rules

- Never commit production secrets, private keys, `.env`, `.dev.vars`, wallet signing material or API tokens.
- D1 is the source of truth for account and financial state.
- R2 KYC storage must remain private.
- Admin authorization is enforced server-side; UI permissions are not a security boundary.
- All financial operations must be validated server-side and protected against duplicate processing.
- Keep the migration history intact. Do not rewrite already-applied production migrations.
- Use a staging D1/R2 environment before production.
- Change the initial inspection account password before real-money operation.

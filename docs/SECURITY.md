# CAPITAL Security Rules

- Never commit production secrets, private keys, `.env`, `.dev.vars`, wallet signing material or API tokens.
- D1 is the source of truth for account and financial state.
- Admin authorization is enforced server-side; UI permissions are not a security boundary.
- All financial operations must be validated server-side and protected against duplicate processing.
- Keep the migration history intact. Do not rewrite already-applied production migrations.
- Use a staging D1 environment before production.
- Legacy bundled inspection accounts are removed by the final cleanup migration. Use only a production `ADMIN_PASSWORD_HASH` owner credential.
- Configure `TRONSCAN_API_KEY` before allowing Admin to approve deposits; deposit approval is blocked without server-side on-chain verification.

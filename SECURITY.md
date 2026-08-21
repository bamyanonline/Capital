# CAPITAL v1 security notes

Implemented in this revision:

- Server-side password hashing with `scrypt`.
- HttpOnly, SameSite session cookies.
- Rolling 30-minute user sessions and 60-minute admin sessions.
- Rate limiting on authentication and reset requests.
- Security headers including CSP, frame protection and MIME sniffing protection.
- Server-side validation for wallet, deposit, withdrawal and VIP activation.
- Server-side financial ledger for approved deposits, withdrawals and VIP capital locks.
- Admin authentication separated from user authentication.
- Admin audit log.
- Password reset tokens are stored hashed and expire after 30 minutes.
- No raw passwords are returned by APIs.
- Atomic JSON database writes.

Before production:

1. Replace the default admin credentials.
2. Put the server behind HTTPS and a reverse proxy/WAF.
3. Replace JSON storage with PostgreSQL (or another transactional database) before handling meaningful concurrent traffic.
4. Connect a trusted TRON verification provider for deposits.
5. Implement a controlled transaction-signing/broadcast service for withdrawals.
6. Configure a real password-reset email provider.
7. Add scheduled encrypted backups and monitoring.

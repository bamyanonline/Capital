-- Remove legacy bundled inspection accounts from any database that previously applied them.
-- This migration intentionally contains no credentials or email addresses.
PRAGMA foreign_keys = ON;

DELETE FROM admin_sessions WHERE email IN (SELECT email FROM admin_accounts WHERE id = 'ADM_NACAM');
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE id = 'CAPNACAM');
DELETE FROM admin_accounts WHERE id = 'ADM_NACAM';
DELETE FROM users WHERE id = 'CAPNACAM';

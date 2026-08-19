-- CAPITAL v4.2 backend hardening.
-- Additive migration; existing financial data is preserved.

PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN deleted_at TEXT;

ALTER TABLE deposits ADD COLUMN idempotency_key TEXT;
ALTER TABLE withdrawals ADD COLUMN withdrawal_date TEXT;
ALTER TABLE withdrawals ADD COLUMN idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_deposit_user_idempotency
  ON deposits(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

-- One financial withdrawal per user per Afghanistan financial date.
-- Existing rows are backfilled from their ISO created_at date; new writes use the backend's Asia/Kabul date key.
UPDATE withdrawals
SET withdrawal_date = substr(datetime(created_at, '+4 hours', '+30 minutes'), 1, 10)
WHERE withdrawal_date IS NULL;

-- Preserve any legacy same-day duplicates without deleting financial history.
UPDATE withdrawals
SET withdrawal_date = NULL
WHERE rowid IN (
  SELECT rowid FROM (
    SELECT rowid, ROW_NUMBER() OVER (PARTITION BY user_id, withdrawal_date ORDER BY created_at, id) AS rn
    FROM withdrawals
    WHERE withdrawal_date IS NOT NULL
  )
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_withdrawal_user_financial_date
  ON withdrawals(user_id, withdrawal_date);

CREATE UNIQUE INDEX IF NOT EXISTS uq_withdrawal_user_idempotency
  ON withdrawals(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

CREATE TABLE IF NOT EXISTS auth_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_key_created
  ON auth_attempts(key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_created
  ON auth_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_kyc_status_submitted
  ON kyc_verifications(status, submitted_at DESC);

ALTER TABLE deposits ADD COLUMN processing_nonce TEXT;
ALTER TABLE withdrawals ADD COLUMN processing_nonce TEXT;

CREATE INDEX IF NOT EXISTS idx_deposits_processing_nonce ON deposits(processing_nonce);
CREATE INDEX IF NOT EXISTS idx_withdrawals_processing_nonce ON withdrawals(processing_nonce);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_type_reference
  ON ledger_entries(type, reference_id)
  WHERE reference_id IS NOT NULL AND reference_id <> ''
    AND type IN ('deposit','withdrawal','referral_bonus','referral_reversal');

CREATE UNIQUE INDEX IF NOT EXISTS uq_withdrawal_nonempty_txid
  ON withdrawals(txid)
  WHERE txid IS NOT NULL AND txid <> '';

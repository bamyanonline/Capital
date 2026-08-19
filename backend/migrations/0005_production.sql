-- CAPITAL production hardening v4.3
-- Additive schema: reserves withdrawals, server-side settings, admin roles, idempotency audit.
PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN reserved_withdrawal_micro INTEGER NOT NULL DEFAULT 0;

UPDATE users
SET reserved_withdrawal_micro = COALESCE((
  SELECT SUM(w.amount_micro) FROM withdrawals w
  WHERE w.user_id = users.id AND w.status IN ('pending','approved','processing')
), 0);

CREATE INDEX IF NOT EXISTS idx_users_reserved_withdrawal ON users(reserved_withdrawal_micro);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals(user_id,status);

-- Expand withdrawal state machine without losing existing data.
CREATE TABLE IF NOT EXISTS withdrawals_v5 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_micro INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  network TEXT NOT NULL DEFAULT 'TRC20',
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','processing','completed','rejected','expired')),
  blockchain_status TEXT NOT NULL DEFAULT 'not_sent',
  fee_micro INTEGER NOT NULL DEFAULT 0,
  net_amount_micro INTEGER NOT NULL DEFAULT 0,
  txid TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  processed_at TEXT,
  reject_reason TEXT NOT NULL DEFAULT '',
  withdrawal_date TEXT,
  idempotency_key TEXT,
  processing_nonce TEXT
);
INSERT INTO withdrawals_v5(id,user_id,amount_micro,currency,network,address,status,blockchain_status,fee_micro,net_amount_micro,txid,created_at,processed_at,reject_reason,withdrawal_date,idempotency_key,processing_nonce)
SELECT id,user_id,amount_micro,currency,network,address,status,blockchain_status,fee_micro,net_amount_micro,txid,created_at,processed_at,reject_reason,withdrawal_date,idempotency_key,processing_nonce FROM withdrawals;
DROP TABLE withdrawals;
ALTER TABLE withdrawals_v5 RENAME TO withdrawals;
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_created ON withdrawals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals(user_id,status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_processing_nonce ON withdrawals(processing_nonce);
CREATE UNIQUE INDEX IF NOT EXISTS uq_withdrawal_user_financial_date ON withdrawals(user_id, withdrawal_date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_withdrawal_user_idempotency ON withdrawals(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';
CREATE UNIQUE INDEX IF NOT EXISTS uq_withdrawal_nonempty_txid ON withdrawals(txid) WHERE txid IS NOT NULL AND txid <> '';

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS admin_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager' CHECK(role IN ('owner','manager')),
  permissions_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_status ON admin_accounts(status);



INSERT OR IGNORE INTO system_settings(key,value,updated_at,updated_by) VALUES
('deposit_network','TRC20',datetime('now'),'SYSTEM'),
('deposit_currency','USDT',datetime('now'),'SYSTEM'),
('withdrawal_network','TRC20',datetime('now'),'SYSTEM'),
('withdrawal_currency','USDT',datetime('now'),'SYSTEM'),
('withdrawal_fee','0.10',datetime('now'),'SYSTEM'),
('withdrawal_window_start','480',datetime('now'),'SYSTEM'),
('withdrawal_window_end','960',datetime('now'),'SYSTEM'),
('minimum_remaining_available','20',datetime('now'),'SYSTEM'),
('team_rate','0.001',datetime('now'),'SYSTEM'),
('referral_rate','0.05',datetime('now'),'SYSTEM'),
('team_multiplier','3',datetime('now'),'SYSTEM');

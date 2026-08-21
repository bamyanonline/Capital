PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY CHECK (id GLOB 'CAP[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'),
  name TEXT NOT NULL DEFAULT '',
  family TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','blocked')),
  created_at TEXT NOT NULL,
  last_login_at TEXT,
  wallet TEXT NOT NULL DEFAULT '',
  referred_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  balance_micro INTEGER NOT NULL DEFAULT 0,
  available_micro INTEGER NOT NULL DEFAULT 0,
  invested_capital_micro INTEGER NOT NULL DEFAULT 0,
  daily_profit_micro INTEGER NOT NULL DEFAULT 0,
  team_profit_micro INTEGER NOT NULL DEFAULT 0,
  referral_income_micro INTEGER NOT NULL DEFAULT 0,
  total_profit_micro INTEGER NOT NULL DEFAULT 0,
  total_withdrawals_micro INTEGER NOT NULL DEFAULT 0,
  active_plan_vip INTEGER,
  active_plan_amount_micro INTEGER,
  active_plan_daily_profit_micro INTEGER,
  active_plan_activated_at TEXT,
  profit_state TEXT NOT NULL DEFAULT 'inactive' CHECK (profit_state IN ('inactive','pending','active','stopped')),
  profit_eligible_from_date TEXT,
  team_profit_eligible_from_date TEXT,
  cap_status TEXT CHECK (cap_status IN ('LIMITED_100','NO_CAP')),
  cap_amount_micro INTEGER,
  cap_used_micro INTEGER NOT NULL DEFAULT 0,
  cap_eligible_at TEXT,
  cap_last_changed_at TEXT,
  referral_bonus_amount_micro INTEGER NOT NULL DEFAULT 0,
  referral_bonus_id TEXT,
  referral_bonus_recipient TEXT,
  referral_bonus_reversed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_active_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_active_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deposits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_micro INTEGER NOT NULL,
  txid TEXT NOT NULL UNIQUE,
  currency TEXT NOT NULL DEFAULT 'USDT',
  network TEXT NOT NULL DEFAULT 'TRC20',
  to_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  verification_status TEXT NOT NULL DEFAULT 'pending',
  blockchain_status TEXT NOT NULL DEFAULT 'unverified',
  created_at TEXT NOT NULL,
  verified_at TEXT,
  rejected_at TEXT,
  reject_reason TEXT NOT NULL DEFAULT '',
  approved_by TEXT,
  referral_bonus_id TEXT,
  referral_bonus_amount_micro INTEGER NOT NULL DEFAULT 0,
  referral_bonus_recipient TEXT
);
CREATE INDEX IF NOT EXISTS idx_deposits_user_created ON deposits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);

CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_micro INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  network TEXT NOT NULL DEFAULT 'TRC20',
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','rejected','expired')),
  blockchain_status TEXT NOT NULL DEFAULT 'not_sent',
  fee_micro INTEGER NOT NULL DEFAULT 0,
  net_amount_micro INTEGER NOT NULL DEFAULT 0,
  txid TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  processed_at TEXT,
  reject_reason TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_created ON withdrawals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount_micro INTEGER NOT NULL,
  reference_id TEXT,
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ledger_user_created ON ledger_entries(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_profit ON ledger_entries(user_id, type, json_extract(meta_json,'$.profitDate')) WHERE type='daily_profit';
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_profit ON ledger_entries(user_id, type, json_extract(meta_json,'$.profitDate'), json_extract(meta_json,'$.memberId')) WHERE type='team_profit';

CREATE TABLE IF NOT EXISTS cap_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  team_capital_micro INTEGER NOT NULL,
  threshold_micro INTEGER NOT NULL,
  previous_cap_used_micro INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cap_history_user_created ON cap_history(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS reset_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

CREATE TABLE IF NOT EXISTS notification_reads (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id TEXT NOT NULL,
  read_at TEXT NOT NULL,
  PRIMARY KEY(user_id, notification_id)
);

CREATE TABLE IF NOT EXISTS system_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

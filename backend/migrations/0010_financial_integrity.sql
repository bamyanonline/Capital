-- CAPITAL v1 financial integrity and audit support.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS wallet_change_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_address TEXT NOT NULL DEFAULT '',
  new_address TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wallet_history_user_created ON wallet_change_history(user_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS financial_job_runs (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  financial_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('running','completed','failed')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  processed_days INTEGER NOT NULL DEFAULT 0,
  processed_users INTEGER NOT NULL DEFAULT 0,
  failed_users INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_financial_job_runs_started ON financial_job_runs(started_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_financial_job_daily_date ON financial_job_runs(job_type, financial_date);

CREATE TABLE IF NOT EXISTS reconciliation_issues (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expected_balance_micro INTEGER NOT NULL,
  actual_balance_micro INTEGER NOT NULL,
  expected_available_micro INTEGER NOT NULL,
  actual_available_micro INTEGER NOT NULL,
  detected_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','ignored')),
  resolved_at TEXT,
  resolved_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_reconciliation_status_detected ON reconciliation_issues(status, detected_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reconciliation_open_user ON reconciliation_issues(user_id) WHERE status='open';

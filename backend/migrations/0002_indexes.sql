CREATE INDEX IF NOT EXISTS idx_users_invested ON users(invested_capital_micro);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON ledger_entries(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_txid ON deposits(txid);

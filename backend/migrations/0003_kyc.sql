-- CAPITAL v4.1: KYC foundation
-- Additive migration: does not modify existing tables or financial logic.

CREATE TABLE IF NOT EXISTS kyc_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  document_photo_key TEXT NOT NULL,
  selfie_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('not_verified','pending','approved','rejected')),
  rejection_reason TEXT,
  submitted_at TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kyc_status
  ON kyc_verifications(status);

CREATE INDEX IF NOT EXISTS idx_kyc_user
  ON kyc_verifications(user_id);

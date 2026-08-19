-- CAPITAL v1 access accounts. Password is stored only as a PBKDF2 hash.
-- The requested access credential is intended for initial inspection and should be rotated before real-money production.
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO users(id,name,family,email,password_hash,status,created_at,updated_at)
VALUES('CAPNACAM','Nacam','', 'nacam@gmail.com','pbkdf2$5c091637d704b3d013f4852a2cbac53b59b844bb13d6e15d3a421a79ed53440e$e9e469f7c19f339211674b2785826a886924ad241ae846aa80dda53bbc902a65','active',datetime('now'),datetime('now'));

INSERT OR IGNORE INTO admin_accounts(id,email,name,password_hash,role,permissions_json,status,created_at,updated_at)
VALUES('ADM_NACAM','nacam@gmail.com','Nacam','pbkdf2$5c091637d704b3d013f4852a2cbac53b59b844bb13d6e15d3a421a79ed53440e$e9e469f7c19f339211674b2785826a886924ad241ae846aa80dda53bbc902a65','owner','["*"]','active',datetime('now'),datetime('now'));

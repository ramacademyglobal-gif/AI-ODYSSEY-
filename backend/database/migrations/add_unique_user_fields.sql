-- Prevent duplicate user-submitted identity / payment / team fields.
-- Safe to re-run. Run in Supabase SQL editor after wiping test data.

-- Phone: one registration per mobile number
create unique index if not exists participants_phone_unique
  on participants (phone);

-- Payment transaction / UTR: one registration per transaction id
-- (NULLs allowed for legacy rows without payment)
create unique index if not exists participants_payment_txn_id_unique
  on participants (payment_txn_id)
  where payment_txn_id is not null;

-- Team name: case-insensitive unique (trim handled in app)
create unique index if not exists teams_team_name_lower_unique
  on teams (lower(team_name));

-- Email / hacker_id / team_code / qr_token already UNIQUE in schema.
-- Keep a non-unique index helper for payment lookups if the unique one exists.
drop index if exists idx_participants_payment_txn_id;

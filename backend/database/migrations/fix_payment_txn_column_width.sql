-- Fix: payment txn / file columns must hold real UPI IDs (often 12–40+ chars).
-- Run this ENTIRE file once in Supabase SQL Editor.
-- Safe to re-run.

-- Widen payment columns (fixes: value too long for type character varying(10))
alter table participants
  add column if not exists payment_txn_id varchar(128);

alter table participants
  alter column payment_txn_id type varchar(128)
  using payment_txn_id::varchar(128);

alter table participants
  add column if not exists payment_drive_file_id text;

alter table participants
  alter column payment_drive_file_id type text
  using payment_drive_file_id::text;

alter table participants
  add column if not exists payment_drive_file_url text;

alter table participants
  add column if not exists payment_verified_at timestamptz;

alter table participants
  add column if not exists roll_number varchar(60);

-- Unique txn (one payment → one registration)
create unique index if not exists participants_payment_txn_id_unique
  on participants (payment_txn_id)
  where payment_txn_id is not null;

create index if not exists idx_participants_roll_number
  on participants (roll_number);

-- Optional cleanup: delete incomplete test rows with no payment proof
-- (uncomment if you want to remove failed registration leftovers)
-- delete from team_members
-- where participant_id in (
--   select id from participants
--   where payment_txn_id is null
--     and created_at > now() - interval '7 days'
-- );
-- delete from participants
-- where payment_txn_id is null
--   and created_at > now() - interval '7 days'
--   and email not like '%@members.odyssey24.local';

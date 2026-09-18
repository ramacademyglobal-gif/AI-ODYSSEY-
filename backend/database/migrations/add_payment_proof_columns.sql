-- Payment proof: transaction ID + Google Drive file link on participants
alter table participants
  add column if not exists payment_txn_id varchar(128),
  add column if not exists payment_drive_file_id varchar(128),
  add column if not exists payment_drive_file_url text,
  add column if not exists payment_verified_at timestamptz;

create index if not exists idx_participants_payment_txn_id
  on participants(payment_txn_id);

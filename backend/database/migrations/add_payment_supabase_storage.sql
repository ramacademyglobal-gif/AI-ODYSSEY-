-- Payment proof screenshots on Supabase Storage (free tier).
-- Run in Supabase SQL editor if you prefer SQL over auto-create-on-upload.

-- 1) Ensure payment columns exist (safe to re-run)
alter table participants
  add column if not exists payment_txn_id varchar(128),
  add column if not exists payment_drive_file_id varchar(128),
  add column if not exists payment_drive_file_url text,
  add column if not exists payment_verified_at timestamptz;

-- Paths / URLs may exceed 128 chars
alter table participants
  alter column payment_drive_file_id type text;

create index if not exists idx_participants_payment_txn_id
  on participants(payment_txn_id);

-- 2) Create private storage bucket for payment screenshots
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Backend uses the service role key, so no extra storage policies are required for uploads.
-- (Do not expose the service role key to the browser.)

-- Align checkins with app schema (run in Supabase SQL editor).
-- Live DB currently has id, participant_id, checked_in_by but not checked_in_at / method.

alter table public.checkins
  add column if not exists checked_in_at timestamptz not null default now();

alter table public.checkins
  add column if not exists method varchar(50) not null default 'QR';

create unique index if not exists checkins_participant_unique
  on public.checkins (participant_id);

create index if not exists idx_checkins_participant
  on public.checkins (participant_id);

create index if not exists idx_checkins_checked_in_at
  on public.checkins (checked_in_at);

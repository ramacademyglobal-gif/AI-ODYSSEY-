-- One official clock for AI Odyssey 24.
-- Run this once in the Supabase SQL editor.
-- The 24-hour window stays empty until a judge starts it from the site.

create table if not exists public.hackathon_clock (
  id smallint primary key default 1,
  status text not null default 'AWAITING_START',
  official_start_time timestamptz,
  official_end_time timestamptz,
  constraint hackathon_clock_singleton check (id = 1),
  constraint hackathon_clock_status check (status in ('AWAITING_START', 'LIVE', 'ENDED'))
);

insert into public.hackathon_clock (id, status)
values (1, 'AWAITING_START')
on conflict (id) do nothing;

alter table public.hackathon_clock enable row level security;

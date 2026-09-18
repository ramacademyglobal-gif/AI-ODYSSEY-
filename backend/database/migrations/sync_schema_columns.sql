-- =========================================================
-- AI ODYSSEY 24 — sync missing columns with schema.sql
-- Run this ENTIRE file once in Supabase SQL Editor
-- =========================================================

-- PARTICIPANTS
alter table participants add column if not exists department varchar(150);
alter table participants add column if not exists year varchar(30);
alter table participants add column if not exists qr_token uuid;
alter table participants add column if not exists status varchar(30);
alter table participants add column if not exists created_at timestamptz;
alter table participants add column if not exists updated_at timestamptz;

update participants set department = coalesce(department, 'General') where department is null;
update participants set year = coalesce(year, '1st Year') where year is null;
update participants set qr_token = coalesce(qr_token, gen_random_uuid()) where qr_token is null;
update participants set status = coalesce(status, 'REGISTERED') where status is null;
update participants set created_at = coalesce(created_at, now()) where created_at is null;
update participants set updated_at = coalesce(updated_at, now()) where updated_at is null;

alter table participants alter column department set default 'General';
alter table participants alter column year set default '1st Year';
alter table participants alter column qr_token set default gen_random_uuid();
alter table participants alter column status set default 'REGISTERED';
alter table participants alter column created_at set default now();
alter table participants alter column updated_at set default now();

alter table participants alter column department set not null;
alter table participants alter column year set not null;
alter table participants alter column qr_token set not null;
alter table participants alter column status set not null;

create unique index if not exists participants_qr_token_key on participants (qr_token);
create index if not exists idx_participants_status on participants (status);

-- TEAMS
alter table teams add column if not exists member_count integer;
alter table teams add column if not exists status varchar(30);
alter table teams add column if not exists created_at timestamptz;
alter table teams add column if not exists updated_at timestamptz;

update teams t
set member_count = coalesce(
  t.member_count,
  (select count(*)::integer from team_members tm where tm.team_id = t.id),
  0
);

update teams set status = coalesce(status, 'WAITING') where status is null;
update teams set created_at = coalesce(created_at, now()) where created_at is null;
update teams set updated_at = coalesce(updated_at, now()) where updated_at is null;

alter table teams alter column member_count set default 0;
alter table teams alter column status set default 'WAITING';
alter table teams alter column created_at set default now();
alter table teams alter column updated_at set default now();

alter table teams alter column member_count set not null;
alter table teams alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'team_member_count_bounds_check'
  ) then
    alter table teams
      add constraint team_member_count_bounds_check
      check (member_count >= 0 and member_count <= team_size);
  end if;
exception when others then
  raise notice 'team_member_count_bounds_check skipped: %', sqlerrm;
end $$;

create index if not exists idx_teams_status on teams (status);

-- CHECKINS columns + unique participant
alter table checkins
  add column if not exists checked_in_at timestamptz not null default now();
alter table checkins
  add column if not exists method varchar(50) not null default 'QR';
create unique index if not exists checkins_participant_unique
  on checkins (participant_id);
create index if not exists idx_checkins_checked_in_at
  on checkins (checked_in_at);

-- Ensure admin_audit_logs exists
create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  action varchar(100) not null,
  target_type varchar(50),
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

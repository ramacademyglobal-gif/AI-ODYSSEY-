create extension if not exists "pgcrypto";

-- =========================================
-- PARTICIPANTS
-- =========================================

create table participants (
    id uuid primary key default gen_random_uuid(),

    hacker_id varchar(30) not null unique,

    full_name varchar(150) not null,

    email varchar(255) not null unique,

    phone varchar(20) not null unique,

    college varchar(255) not null,

    department varchar(150) not null,

    year varchar(30) not null,

    qr_token uuid not null unique default gen_random_uuid(),

    status varchar(30) not null default 'REGISTERED',

    payment_txn_id varchar(128),
    payment_drive_file_id varchar(128),
    payment_drive_file_url text,
    payment_verified_at timestamptz,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

create unique index if not exists participants_payment_txn_id_unique
  on participants (payment_txn_id)
  where payment_txn_id is not null;


-- =========================================
-- TEAMS
-- =========================================
-- Race-safe capacity:
-- member_count is denormalized and constrained by team_size.
-- Future join RPC should lock the team row (SELECT ... FOR UPDATE),
-- then atomically:
--   UPDATE teams
--   SET member_count = member_count + 1
--   WHERE id = $team_id
--     AND member_count < team_size
--   RETURNING *;
-- and only INSERT into team_members when that UPDATE affects a row.
-- The CHECK (member_count <= team_size) rejects overfill even under races.

create table teams (
    id uuid primary key default gen_random_uuid(),

    team_code varchar(20) not null unique,

    team_name varchar(150) not null,

    team_size integer not null,

    member_count integer not null default 0,

    leader_participant_id uuid not null
        references participants(id)
        on delete restrict,

    status varchar(30) not null default 'WAITING',

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint team_size_check
        check (team_size in (3, 4)),

    constraint team_code_format_check
        check (team_code ~ '^ODYSSEY24-[A-Z0-9]{4}$'),

    constraint team_member_count_bounds_check
        check (member_count >= 0 and member_count <= team_size)
);

create unique index if not exists teams_team_name_lower_unique
    on teams (lower(team_name));


-- =========================================
-- TEAM MEMBERS
-- =========================================
-- participant_id UNIQUE => a participant can belong to only one team.

create table team_members (
    id uuid primary key default gen_random_uuid(),

    team_id uuid not null
        references teams(id)
        on delete cascade,

    participant_id uuid not null unique
        references participants(id)
        on delete cascade,

    role varchar(20) not null default 'MEMBER',

    joined_at timestamptz not null default now(),

    constraint team_role_check
        check (role in ('LEADER', 'MEMBER'))
);


-- =========================================
-- CHECKINS
-- =========================================

create table checkins (
    id uuid primary key default gen_random_uuid(),

    participant_id uuid not null
        references participants(id)
        on delete cascade,

    checked_in_at timestamptz not null default now(),

    checked_in_by uuid,

    method varchar(50) not null default 'QR',

    -- One check-in record per participant (safe against concurrent duplicates)
    constraint checkins_participant_unique unique (participant_id)
);


-- =========================================
-- ADMIN AUDIT LOG
-- =========================================

create table admin_audit_logs (
    id uuid primary key default gen_random_uuid(),

    admin_id uuid,

    action varchar(100) not null,

    target_type varchar(50),

    target_id uuid,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);


-- =========================================
-- INDEXES
-- =========================================

create index idx_participants_hacker_id
    on participants(hacker_id);

create index idx_participants_email
    on participants(email);

create index idx_participants_qr_token
    on participants(qr_token);

create index idx_participants_status
    on participants(status);

create index idx_teams_team_code
    on teams(team_code);

create index idx_teams_status
    on teams(status);

create index idx_teams_leader_participant_id
    on teams(leader_participant_id);

create index idx_team_members_team_id
    on team_members(team_id);

create index idx_team_members_role
    on team_members(role);

create index idx_checkins_participant
    on checkins(participant_id);

create index idx_checkins_checked_in_at
    on checkins(checked_in_at);

create index idx_admin_audit_logs_admin_id
    on admin_audit_logs(admin_id);

create index idx_admin_audit_logs_created_at
    on admin_audit_logs(created_at);

create index idx_admin_audit_logs_target
    on admin_audit_logs(target_type, target_id);

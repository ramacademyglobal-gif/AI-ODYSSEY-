-- Optional: store register / roll number on participants (one-team registration).
-- Safe to run multiple times.

alter table participants
  add column if not exists roll_number varchar(60);

create index if not exists idx_participants_roll_number
  on participants (roll_number);

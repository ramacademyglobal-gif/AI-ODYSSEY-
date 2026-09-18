-- Apply on existing databases that already have checkins without a unique constraint.
-- Safe to run multiple times.

create unique index if not exists checkins_participant_unique
  on checkins (participant_id);

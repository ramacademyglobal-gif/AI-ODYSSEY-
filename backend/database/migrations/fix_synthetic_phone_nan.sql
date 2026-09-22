-- Fix teammate phones that end with 'NaN' from the off-by-one syntheticMemberContact bug.
-- Safe: only rewrites rows whose phone already contains 'NaN'. Does not delete anyone.
-- Run once in Supabase SQL Editor if bad rows exist. Safe to re-run.

update participants
set phone = '9' || lpad(
  (abs(hashtext(id::text || coalesce(hacker_id, ''))) % 1000000000)::text,
  9,
  '0'
)
where phone like '%NaN%';

-- Optional check:
-- select id, hacker_id, email, phone
-- from participants
-- where phone like '%NaN%' or length(phone) <> 10;

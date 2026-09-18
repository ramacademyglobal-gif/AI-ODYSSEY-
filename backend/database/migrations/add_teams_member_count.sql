-- Fix live DBs missing denormalized team capacity column.
-- Required for create/join team RPCs and admin dashboard.

alter table teams
  add column if not exists member_count integer;

update teams t
set member_count = coalesce((
  select count(*)::integer
  from team_members tm
  where tm.team_id = t.id
), 0)
where member_count is null;

alter table teams
  alter column member_count set default 0;

alter table teams
  alter column member_count set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_member_count_bounds_check'
  ) then
    alter table teams
      add constraint team_member_count_bounds_check
      check (member_count >= 0 and member_count <= team_size);
  end if;
end $$;

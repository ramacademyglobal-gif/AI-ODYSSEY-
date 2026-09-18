-- Race-safe team join RPC (apply in Supabase SQL editor after schema.sql).
-- Does NOT alter schema.sql; uses existing teams.member_count + CHECK.

create or replace function public.join_team(
  p_team_code text,
  p_participant_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_team public.teams%rowtype;
  v_participant public.participants%rowtype;
  v_new_count integer;
  v_status text;
  v_member public.team_members%rowtype;
begin
  v_code := upper(trim(p_team_code));

  if v_code !~ '^ODYSSEY24-[A-Z0-9]{4}$' then
    return jsonb_build_object(
      'ok', false,
      'error', 'INVALID_TEAM_CODE',
      'message', 'Team code must match ODYSSEY24-XXXX'
    );
  end if;

  select * into v_participant
  from public.participants
  where id = p_participant_id;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error', 'PARTICIPANT_NOT_FOUND',
      'message', 'Participant not found'
    );
  end if;

  if exists (
    select 1 from public.team_members where participant_id = p_participant_id
  ) then
    return jsonb_build_object(
      'ok', false,
      'error', 'ALREADY_ON_TEAM',
      'message', 'Participant already belongs to a team'
    );
  end if;

  select * into v_team
  from public.teams
  where team_code = v_code
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error', 'TEAM_NOT_FOUND',
      'message', 'Team not found'
    );
  end if;

  if v_team.member_count >= v_team.team_size then
    return jsonb_build_object(
      'ok', false,
      'error', 'TEAM_FULL',
      'message', 'Team is already at capacity'
    );
  end if;

  v_new_count := v_team.member_count + 1;

  if v_team.team_size = 3 then
    if v_new_count >= 3 then
      v_status := 'COMPLETE';
    else
      v_status := 'WAITING';
    end if;
  else
    if v_new_count >= 4 then
      v_status := 'FULL';
    elsif v_new_count >= 3 then
      v_status := 'COMPLETE';
    else
      v_status := 'WAITING';
    end if;
  end if;

  update public.teams
  set
    member_count = v_new_count,
    status = v_status,
    updated_at = now()
  where id = v_team.id
    and member_count < team_size;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error', 'TEAM_FULL',
      'message', 'Team is already at capacity'
    );
  end if;

  begin
    insert into public.team_members (team_id, participant_id, role)
    values (v_team.id, p_participant_id, 'MEMBER')
    returning * into v_member;
  exception
    when unique_violation then
      update public.teams
      set
        member_count = greatest(member_count - 1, 0),
        updated_at = now()
      where id = v_team.id;

      return jsonb_build_object(
        'ok', false,
        'error', 'ALREADY_ON_TEAM',
        'message', 'Participant already belongs to a team'
      );
  end;

  select * into v_team from public.teams where id = v_team.id;

  return jsonb_build_object(
    'ok', true,
    'team', jsonb_build_object(
      'id', v_team.id,
      'team_code', v_team.team_code,
      'team_name', v_team.team_name,
      'team_size', v_team.team_size,
      'member_count', v_team.member_count,
      'status', v_team.status,
      'leader_participant_id', v_team.leader_participant_id
    ),
    'membership', jsonb_build_object(
      'id', v_member.id,
      'team_id', v_member.team_id,
      'participant_id', v_member.participant_id,
      'role', v_member.role,
      'joined_at', v_member.joined_at
    )
  );
end;
$$;

create or replace function public.create_team(
  p_team_name text,
  p_team_size integer,
  p_leader_participant_id uuid,
  p_team_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_team public.teams%rowtype;
  v_member public.team_members%rowtype;
  v_status text := 'WAITING';
begin
  v_code := upper(trim(p_team_code));

  if p_team_size not in (3, 4) then
    return jsonb_build_object(
      'ok', false,
      'error', 'INVALID_TEAM_SIZE',
      'message', 'Team size must be 3 or 4'
    );
  end if;

  if v_code !~ '^ODYSSEY24-[A-Z0-9]{4}$' then
    return jsonb_build_object(
      'ok', false,
      'error', 'INVALID_TEAM_CODE',
      'message', 'Team code must match ODYSSEY24-XXXX'
    );
  end if;

  if not exists (
    select 1 from public.participants where id = p_leader_participant_id
  ) then
    return jsonb_build_object(
      'ok', false,
      'error', 'PARTICIPANT_NOT_FOUND',
      'message', 'Leader participant not found'
    );
  end if;

  if exists (
    select 1 from public.team_members where participant_id = p_leader_participant_id
  ) then
    return jsonb_build_object(
      'ok', false,
      'error', 'ALREADY_ON_TEAM',
      'message', 'Participant already belongs to a team'
    );
  end if;

  begin
    insert into public.teams (
      team_code,
      team_name,
      team_size,
      member_count,
      leader_participant_id,
      status
    )
    values (
      v_code,
      trim(p_team_name),
      p_team_size,
      1,
      p_leader_participant_id,
      v_status
    )
    returning * into v_team;
  exception
    when unique_violation then
      return jsonb_build_object(
        'ok', false,
        'error', 'TEAM_CODE_TAKEN',
        'message', 'Team code already exists'
      );
  end;

  begin
    insert into public.team_members (team_id, participant_id, role)
    values (v_team.id, p_leader_participant_id, 'LEADER')
    returning * into v_member;
  exception
    when unique_violation then
      delete from public.teams where id = v_team.id;
      return jsonb_build_object(
        'ok', false,
        'error', 'ALREADY_ON_TEAM',
        'message', 'Participant already belongs to a team'
      );
  end;

  return jsonb_build_object(
    'ok', true,
    'team', jsonb_build_object(
      'id', v_team.id,
      'team_code', v_team.team_code,
      'team_name', v_team.team_name,
      'team_size', v_team.team_size,
      'member_count', v_team.member_count,
      'status', v_team.status,
      'leader_participant_id', v_team.leader_participant_id,
      'created_at', v_team.created_at
    ),
    'membership', jsonb_build_object(
      'id', v_member.id,
      'team_id', v_member.team_id,
      'participant_id', v_member.participant_id,
      'role', v_member.role,
      'joined_at', v_member.joined_at
    )
  );
end;
$$;

drop function if exists public.create_team(text, integer, uuid, text, text);

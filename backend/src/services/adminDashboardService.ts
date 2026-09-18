import { supabase } from "../config/supabase.js";

import { AppError } from "../middleware/errorHandler.js";



export type DashboardSummary = {

  total_participants: number;

  total_teams: number;

  complete_teams: number;

  waiting_teams: number;

};



export type TeamStatusItem = {

  team_code: string;

  team_name: string;

  team_size: number;

  member_count: number;

  status: string;

  fill_label: string;

  is_complete: boolean;

};



export type DashboardStats = {

  summary: DashboardSummary;

  team_status: TeamStatusItem[];

};



export type RecentRegistration = {

  hacker_id: string;

  full_name: string;

  college: string;

  created_at: string;

  team: {

    team_code: string;

    team_name: string;

    team_size: number;

    member_count: number;

    status: string;

    fill_label: string;

  } | null;

};



export type DashboardRecent = {

  registrations: RecentRegistration[];

};



type TeamStatRow = {

  team_code: string;

  team_name: string;

  team_size: number;

  member_count: number;

  status: string;

};



function isTeamComplete(team: {

  member_count: number;

  team_size: number;

  status: string;

}): boolean {

  if (team.member_count >= team.team_size) {

    return true;

  }

  const status = team.status.toUpperCase();

  return status === "COMPLETE" || status === "FULL";

}



function buildFillLabel(team: {

  member_count: number;

  team_size: number;

}): string {

  const fill = `${team.member_count}/${team.team_size}`;

  if (team.member_count < team.team_size) {

    return fill;

  }

  if (team.team_size === 4) {

    return `${fill} FULL`;

  }

  return `${fill} COMPLETE`;

}



function toTeamStatusItem(team: TeamStatRow): TeamStatusItem {

  const complete = isTeamComplete(team);

  return {

    team_code: team.team_code,

    team_name: team.team_name,

    team_size: team.team_size,

    member_count: team.member_count,

    status: complete

      ? team.team_size === 4

        ? "FULL"

        : "COMPLETE"

      : "WAITING",

    fill_label: buildFillLabel(team),

    is_complete: complete,

  };

}



export async function getDashboardStats(): Promise<DashboardStats> {

  type TeamQueryRow = {

    id: string;

    team_code: string;

    team_name: string;

    team_size: number;

    status: string;

    member_count?: number | null;

  };



  let teamsData: TeamQueryRow[] | null = null;

  let teamsErrorMessage: string | null = null;



  {

    const first = await supabase

      .from("teams")

      .select("id, team_code, team_name, team_size, member_count, status")

      .order("created_at", { ascending: false });



    if (!first.error) {

      teamsData = (first.data ?? []) as unknown as TeamQueryRow[];

    } else {

      const msg = first.error.message ?? "";

      const fallbacks = [

        "id, team_code, team_name, team_size, status",

        "id, team_code, team_name, team_size, member_count, status",

        "id, team_code, team_name, team_size",

        "id, team_code, team_name",

      ];

      let resolved = false;

      for (const cols of fallbacks) {

        if (

          /member_count/i.test(msg) ||

          /status/i.test(msg) ||

          /created_at/i.test(msg) ||

          /schema cache|column/i.test(msg)

        ) {

          const fallback = await supabase.from("teams").select(cols);

          if (!fallback.error) {

            teamsData = (fallback.data ?? []) as unknown as TeamQueryRow[];

            resolved = true;

            break;

          }

          teamsErrorMessage = fallback.error.message;

        } else {

          teamsErrorMessage = msg;

          break;

        }

      }

      if (!resolved && !teamsErrorMessage) {

        teamsErrorMessage = msg;

      }

    }

  }



  const [participantsCountResult, teamsCountResult] = await Promise.all([

    supabase.from("participants").select("*", { count: "exact", head: true }),

    supabase.from("teams").select("*", { count: "exact", head: true }),

  ]);



  if (participantsCountResult.error) {

    throw new AppError(500, "Failed to load participant count", "DASHBOARD_STATS_FAILED");

  }

  if (teamsCountResult.error) {

    throw new AppError(500, "Failed to load team count", "DASHBOARD_STATS_FAILED");

  }

  if (teamsErrorMessage) {

    throw new AppError(

      500,

      `Failed to load teams: ${teamsErrorMessage}`,

      "DASHBOARD_STATS_FAILED",

    );

  }



  const rawTeams = teamsData ?? [];



  const needsCounts = rawTeams.some(

    (t) => typeof t.member_count !== "number",

  );

  const countByTeamId = new Map<string, number>();

  if (needsCounts) {

    const { data: memberships } = await supabase

      .from("team_members")

      .select("team_id");

    for (const row of memberships ?? []) {

      const id = row.team_id as string;

      countByTeamId.set(id, (countByTeamId.get(id) ?? 0) + 1);

    }

  }



  const teams: TeamStatRow[] = rawTeams.map((t) => ({

    team_code: t.team_code,

    team_name: t.team_name,

    team_size: t.team_size,

    member_count:

      typeof t.member_count === "number"

        ? t.member_count

        : countByTeamId.get(t.id) ?? 0,

    status: t.status,

  }));



  const teamStatus = teams.map(toTeamStatusItem);

  const completeTeams = teamStatus.filter((t) => t.is_complete).length;

  const waitingTeams = teamStatus.length - completeTeams;



  return {

    summary: {

      total_participants: participantsCountResult.count ?? 0,

      total_teams: teamsCountResult.count ?? 0,

      complete_teams: completeTeams,

      waiting_teams: waitingTeams,

    },

    team_status: teamStatus,

  };

}



type RecentParticipantRow = {

  hacker_id: string;

  full_name: string;

  college: string;

  created_at: string;

  team_members:

    | {

        teams: TeamStatRow | TeamStatRow[] | null;

      }[]

    | null;

};



function extractTeam(

  membership: RecentParticipantRow["team_members"],

): TeamStatRow | null {

  if (!membership || membership.length === 0) {

    return null;

  }

  const nested = membership[0]?.teams ?? null;

  if (!nested) {

    return null;

  }

  return Array.isArray(nested) ? (nested[0] ?? null) : nested;

}



export async function getRecentRegistrations(

  limit = 20,

): Promise<DashboardRecent> {

  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);



  const selectVariants = [

    `

      hacker_id,

      full_name,

      college,

      created_at,

      team_members (

        teams (

          team_code,

          team_name,

          team_size,

          member_count,

          status

        )

      )

    `,

    `

      hacker_id,

      full_name,

      college,

      created_at,

      team_members (

        teams (

          team_code,

          team_name,

          team_size,

          status

        )

      )

    `,

    `hacker_id, full_name, college, created_at`,

  ];



  let data: unknown = null;

  let error: { message?: string } | null = null;



  for (const select of selectVariants) {

    const result = await supabase

      .from("participants")

      .select(select)

      .order("created_at", { ascending: false })

      .limit(safeLimit);



    if (!result.error) {

      data = result.data;

      error = null;

      break;

    }

    error = result.error;

    if (!/column|schema cache/i.test(result.error.message ?? "")) {

      break;

    }

  }



  if (error) {

    throw new AppError(

      500,

      "Failed to load recent registrations",

      "DASHBOARD_RECENT_FAILED",

    );

  }



  const rows = (data ?? []) as RecentParticipantRow[];



  const registrations: RecentRegistration[] = rows.map((row) => {

    const team = extractTeam(row.team_members);

    const fill = team ? toTeamStatusItem(team) : null;



    return {

      hacker_id: row.hacker_id,

      full_name: row.full_name,

      college: row.college,

      created_at: row.created_at,

      team: fill

        ? {

            team_code: fill.team_code,

            team_name: fill.team_name,

            team_size: fill.team_size,

            member_count: fill.member_count,

            status: fill.status,

            fill_label: fill.fill_label,

          }

        : null,

    };

  });



  return { registrations };

}


import { adminRequest } from '@/registration/admin/services/adminAuth'



export type DashboardSummary = {

  total_participants: number

  total_teams: number

  complete_teams: number

  waiting_teams: number

}



export type TeamStatusItem = {

  team_code: string

  team_name: string

  team_size: number

  member_count: number

  status: string

  fill_label: string

  is_complete: boolean

}



export type DashboardStats = {

  summary: DashboardSummary

  team_status: TeamStatusItem[]

}



export type RecentRegistration = {

  hacker_id: string

  full_name: string

  college: string

  created_at: string

  team: {

    team_code: string

    team_name: string

    team_size: number

    member_count: number

    status: string

    fill_label: string

  } | null

}



export type DashboardRecent = {

  registrations: RecentRegistration[]

}



export function fetchDashboardStats() {

  return adminRequest<DashboardStats>('/admin/dashboard/stats')

}



export function fetchDashboardRecent(limit = 20) {

  return adminRequest<DashboardRecent>(

    `/admin/dashboard/recent?limit=${encodeURIComponent(String(limit))}`,

  )

}



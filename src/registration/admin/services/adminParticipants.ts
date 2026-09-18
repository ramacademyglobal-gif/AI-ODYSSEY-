import { adminRequest } from '@/registration/admin/services/adminAuth'

export type AdminParticipantTeam = {
  team_code: string
  team_name: string
  team_size: number
  member_count: number
  status: string
  role: string
}

export type AdminParticipant = {
  id: string
  hacker_id: string
  full_name: string
  email: string
  phone: string
  college: string
  department: string
  year: string
  status: string
  created_at: string
  updated_at: string
  payment_txn_id?: string | null
  payment_drive_file_url?: string | null
  payment_verified_at?: string | null
  team: AdminParticipantTeam | null
}

export type ParticipantListQuery = {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  year?: string
}

export type ParticipantListResult = {
  items: AdminParticipant[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export type UpdateParticipantPayload = {
  full_name: string
  email: string
  phone: string
  college: string
  department: string
  year: string
}

function toQuery(params: ParticipantListQuery): string {
  const search = new URLSearchParams()
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  if (params.search?.trim()) search.set('search', params.search.trim())
  if (params.status) search.set('status', params.status)
  if (params.year) search.set('year', params.year)
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function fetchAdminParticipants(query: ParticipantListQuery = {}) {
  return adminRequest<ParticipantListResult>(
    `/admin/participants${toQuery(query)}`,
  )
}

export function fetchAdminParticipant(hackerId: string) {
  return adminRequest<AdminParticipant>(
    `/admin/participants/${encodeURIComponent(hackerId)}`,
  )
}

export function updateAdminParticipant(
  hackerId: string,
  payload: UpdateParticipantPayload,
) {
  return adminRequest<AdminParticipant>(
    `/admin/participants/${encodeURIComponent(hackerId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
}

export function setAdminParticipantStatus(
  hackerId: string,
  status: 'REGISTERED' | 'CANCELLED',
) {
  return adminRequest<AdminParticipant>(
    `/admin/participants/${encodeURIComponent(hackerId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  )
}

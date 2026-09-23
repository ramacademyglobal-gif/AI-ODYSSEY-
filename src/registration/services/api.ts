const API_BASE =
  (
    process.env.NEXT_PUBLIC_REGISTRATION_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:5000/api"
  ).replace(/\/$/, "");

export type ApiParticipant = {
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
  qr_token?: string
  roll_number?: string | null
}

export type ApiTeamMember = {
  participant_id: string
  full_name: string
  hacker_id: string
  role: 'LEADER' | 'MEMBER'
  joined_at: string
}

export type ApiTeam = {
  team_code: string
  team_name: string
  team_size: number
  member_count: number
  available_slots: number
  status: string
  leader: {
    participant_id: string
    full_name: string
    hacker_id: string
  } | null
  members: ApiTeamMember[]
}

export type ApiPassMember = {
  participant_id: string
  hacker_id: string
  full_name: string
  role: 'LEADER' | 'MEMBER'
  checked_in: boolean
  checked_in_at: string | null
}

export type ApiPass = {
  qr_token: string
  participant: {
    id: string
    hacker_id: string
    full_name: string
    email: string
    status: string
  }
  team: {
    team_code: string
    team_name: string
    team_size: number
    member_count: number
    status: string
  } | null
  members: ApiPassMember[]
}

type ApiSuccess<T> = {
  success: true
  data: T
}

type ApiFailure = {
  success: false
  error?: string
  message?: string
  details?: string[]
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details: string[]

  constructor(status: number, message: string, code?: string, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new ApiError(
      0,
      'Unable to reach the registration server. Check your connection and try again.',
      'NETWORK_ERROR',
    )
  }

  let body: ApiSuccess<T> | ApiFailure | undefined
  try {
    body = (await response.json()) as ApiSuccess<T> | ApiFailure
  } catch {
    throw new ApiError(
      response.status,
      `Request failed (${response.status})`,
      'INVALID_RESPONSE',
    )
  }

  if (!response.ok || !body || body.success !== true) {
    const failure = body && body.success === false ? body : undefined
    const details = failure?.details ?? []
    const message =
      details[0] ||
      failure?.message ||
      `Request failed (${response.status})`

    throw new ApiError(
      response.status,
      message,
      failure?.error,
      details,
    )
  }

  return body.data
}

/** Strip qr_token so it is not kept in registration UI state. */
export function withoutQrToken(participant: ApiParticipant): ApiParticipant {
  const copy = { ...participant }
  delete copy.qr_token
  return copy
}

export type TeamMemberPayload = {
  full_name: string
  department: string
  year: string
  roll_number: string
}

export type RegisterWithPaymentPayload = {
  screenshot: File
  transaction_id: string
  team_name: string
  team_size: 3 | 4
  college: string
  full_name: string
  email: string
  phone: string
  department: string
  year: string
  roll_number: string
  members: TeamMemberPayload[]
}

export type RegisterWithPaymentResult = {
  participant: ApiParticipant
  team: ApiTeam
  role: 'LEADER' | 'MEMBER'
  payment: {
    transaction_id: string
    drive_file_id?: string
    drive_file_url?: string
    file_id?: string
    file_url?: string
  }
}

/** Finalize one-team registration: upload proof, save txn, create full squad. */
export async function registerWithPaymentProof(
  payload: RegisterWithPaymentPayload,
): Promise<RegisterWithPaymentResult> {
  const form = new FormData()
  form.append('screenshot', payload.screenshot)
  form.append('transaction_id', payload.transaction_id)
  form.append('team_name', payload.team_name)
  form.append('team_size', String(payload.team_size))
  form.append('college', payload.college)
  form.append('full_name', payload.full_name)
  form.append('email', payload.email)
  form.append('phone', payload.phone)
  form.append('department', payload.department)
  form.append('year', payload.year)
  form.append('roll_number', payload.roll_number)
  form.append('members', JSON.stringify(payload.members))

  let response: Response
  try {
    response = await fetch(`${API_BASE}/payments/register`, {
      method: 'POST',
      body: form,
    })
  } catch {
    throw new ApiError(
      0,
      'Unable to reach the server. Check your connection and try again.',
      'NETWORK_ERROR',
    )
  }

  let body:
    | { success: true; data: RegisterWithPaymentResult }
    | { success: false; error?: string; message?: string; details?: string[] }
    | undefined
  try {
    body = (await response.json()) as typeof body
  } catch {
    body = undefined
  }

  if (!response.ok || !body || body.success !== true) {
    const failure = body && body.success === false ? body : undefined
    const details = failure?.details ?? []
    throw new ApiError(
      response.status,
      details[0] || failure?.message || 'Registration with payment proof failed.',
      failure?.error,
      details,
    )
  }

  return body.data
}

export function getParticipant(hackerId: string) {
  return request<ApiParticipant>(
    `/participants/${encodeURIComponent(hackerId)}`,
  )
}

/** Early check: leader email / phone already registered (optional txn). */
export function checkRegistrationAvailability(payload: {
  email: string
  phone: string
  payment_txn_id?: string
}) {
  return request<{
    available: true
    email: string
    phone: string
    payment_txn_id?: string
  }>('/participants/check-availability', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      phone: payload.phone,
      ...(payload.payment_txn_id
        ? { payment_txn_id: payload.payment_txn_id }
        : {}),
    }),
  })
}

export function getTeam(code: string) {
  return request<ApiTeam>(`/teams/${encodeURIComponent(code)}`)
}

export type RegistrationCapacity = {
  max: number
  count: number
  remaining: number
  open: boolean
  allowed_team_sizes: number[]
}

export function fetchRegistrationCapacity() {
  return request<RegistrationCapacity>('/participants/capacity')
}

export function getPass(qrToken: string) {
  return request<ApiPass>(`/passes/${encodeURIComponent(qrToken)}`)
}

export { API_BASE }

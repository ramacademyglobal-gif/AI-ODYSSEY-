import { ApiError, API_BASE } from '@/registration/services/api'

const ADMIN_TOKEN_KEY = 'ai_odyssey_24_admin_token'

export type AdminSession = {
  email: string
  username: string
  role: 'admin'
}

export type AdminLoginResult = {
  token: string
  token_type: string
  expires_in: string
  admin: AdminSession
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

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}

export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminToken())
}

export async function adminRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }

  const token = getAdminToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    })
  } catch {
    throw new ApiError(
      0,
      'Unable to reach the server. Check your connection and try again.',
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
      details[0] || failure?.message || `Request failed (${response.status})`

    throw new ApiError(response.status, message, failure?.error, details)
  }

  return body.data
}

export async function adminLogin(
  identifier: string,
  password: string,
): Promise<AdminLoginResult> {
  const data = await adminRequest<AdminLoginResult>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })

  setAdminToken(data.token)
  return data
}

export async function fetchAdminSession(): Promise<AdminSession> {
  const data = await adminRequest<{ admin: AdminSession }>('/admin/me')
  return data.admin
}

export function adminLogout(): void {
  clearAdminToken()
}

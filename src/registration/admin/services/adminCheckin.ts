import { adminRequest } from '@/registration/admin/services/adminAuth'

export type CheckinMember = {
  hacker_id: string
  full_name: string
  role: 'LEADER' | 'MEMBER'
  checked_in: boolean
  checked_in_at: string | null
}

export type CheckinScanResult = {
  participant: {
    hacker_id: string
    full_name: string
    role: 'LEADER' | 'MEMBER'
    checked_in: boolean
    checked_in_at: string | null
  }
  team: {
    team_name: string
    team_code: string
    team_size: number
    status: string
  }
  members: CheckinMember[]
  checkin_summary: {
    checked_in: number
    total: number
    remaining: number
  }
}

export type CheckinActionResult = CheckinScanResult & {
  already_checked_in: boolean
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Extract qr_token from a raw UUID or Digital Hacker Pass check-in URL. */
export function extractQrToken(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (UUID_PATTERN.test(trimmed)) {
    return trimmed
  }

  try {
    const asUrl = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(trimmed, 'https://local.invalid')
    const parts = asUrl.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex((p) => p.toLowerCase() === 'checkin')
    if (idx >= 0 && parts[idx + 1]) {
      const token = decodeURIComponent(parts[idx + 1]).trim()
      if (UUID_PATTERN.test(token)) return token
    }
  } catch {
    // ignore
  }

  return null
}

export function scanAdminCheckin(token: string) {
  return adminRequest<CheckinScanResult>(
    `/admin/checkin/scan/${encodeURIComponent(token)}`,
  )
}

export function submitAdminCheckin(qrToken: string) {
  return adminRequest<CheckinActionResult>('/admin/checkin', {
    method: 'POST',
    body: JSON.stringify({ qr_token: qrToken }),
  })
}

import * as XLSX from 'xlsx-js-style'
import { adminRequest } from '@/registration/admin/services/adminAuth'

export type RosterExportRow = {
  team_code: string
  team_name: string
  team_size: string
  hacker_id: string
  full_name: string
  email: string
  phone: string
  college: string
  department: string
  year: string
  role: string
  created_at: string
}

export type RosterExportPayload = {
  generated_at: string
  columns: string[]
  rows: RosterExportRow[]
}

export const ROSTER_COLUMN_ORDER: Array<keyof RosterExportRow> = [
  'team_code',
  'team_name',
  'team_size',
  'hacker_id',
  'full_name',
  'email',
  'phone',
  'college',
  'department',
  'year',
  'role',
  'created_at',
]

const LEFT_STYLE = {
  alignment: {
    horizontal: 'left' as const,
    vertical: 'center' as const,
    wrapText: true,
  },
}

/**
 * Vertical merges for team_code / team_name / team_size (cols 0–2)
 * so each team reads as one group. No blank spacer rows.
 * Sheet row 0 is the header; data starts at row 1.
 */
export function teamMergesForSheet(rows: RosterExportRow[]): XLSX.Range[] {
  const merges: XLSX.Range[] = []
  let i = 0

  while (i < rows.length) {
    const code = rows[i]?.team_code ?? ''
    let j = i + 1

    if (code) {
      while (j < rows.length && rows[j]?.team_code === code) {
        j += 1
      }
    }

    if (code && j - i > 1) {
      const startSheetRow = i + 1
      const endSheetRow = j
      for (const col of [0, 1, 2]) {
        merges.push({
          s: { r: startSheetRow, c: col },
          e: { r: endSheetRow, c: col },
        })
      }
    }

    i = code ? j : i + 1
  }

  return merges
}

/** Team fields only on the first row of each team; later rows stay blank (merged). */
export function sheetRowsWithGroupedTeams(
  rows: RosterExportRow[],
): Array<Record<keyof RosterExportRow, string>> {
  return rows.map((row, index) => {
    const prev = index > 0 ? rows[index - 1] : null
    const isFirstOfTeam =
      Boolean(row.team_code) &&
      (!prev || prev.team_code !== row.team_code)

    return {
      team_code: isFirstOfTeam ? row.team_code : '',
      team_name: isFirstOfTeam ? row.team_name : '',
      team_size: isFirstOfTeam ? row.team_size : '',
      hacker_id: row.hacker_id ?? '',
      full_name: row.full_name ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      college: row.college ?? '',
      department: row.department ?? '',
      year: row.year ?? '',
      role: row.role ?? '',
      created_at: row.created_at ?? '',
    }
  })
}

function applyLeftAlignment(worksheet: XLSX.WorkSheet): void {
  const ref = worksheet['!ref']
  if (!ref) return

  const range = XLSX.utils.decode_range(ref)
  for (let r = range.s.r; r <= range.e.r; r += 1) {
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const address = XLSX.utils.encode_cell({ r, c })
      const cell = worksheet[address]
      if (!cell) continue
      cell.s = {
        ...(cell.s ?? {}),
        ...LEFT_STYLE,
      }
    }
  }
}

export function fetchRosterExport() {
  return adminRequest<RosterExportPayload>('/admin/export/roster')
}

export type PaymentExportRow = {
  team_name: string
  team_size: string
  full_name: string
  phone: string
  college: string
  transaction_id: string
  screenshot_url: string
}

export type PaymentExportPayload = {
  generated_at: string
  columns: string[]
  rows: PaymentExportRow[]
}

export const PAYMENT_COLUMN_ORDER: Array<keyof PaymentExportRow> = [
  'team_name',
  'team_size',
  'full_name',
  'phone',
  'college',
  'transaction_id',
  'screenshot_url',
]

export function fetchPaymentExport() {
  return adminRequest<PaymentExportPayload>('/admin/export/payments')
}

/** Build and download an .xlsx roster with team fields merged per team. */
export async function downloadRosterExcel(): Promise<void> {
  const payload = await fetchRosterExport()
  const rows = payload.rows.map((row) => ({
    team_code: row.team_code ?? '',
    team_name: row.team_name ?? '',
    team_size: row.team_size ?? '',
    hacker_id: row.hacker_id ?? '',
    full_name: row.full_name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    college: row.college ?? '',
    department: row.department ?? '',
    year: row.year ?? '',
    role: row.role ?? '',
    created_at: row.created_at ?? '',
  }))

  const sheetRows = sheetRowsWithGroupedTeams(rows)

  const worksheet = XLSX.utils.json_to_sheet(sheetRows, {
    header: [...ROSTER_COLUMN_ORDER],
  })

  worksheet['!merges'] = teamMergesForSheet(rows)
  applyLeftAlignment(worksheet)

  worksheet['!cols'] = ROSTER_COLUMN_ORDER.map((key) => {
    if (key === 'email' || key === 'college' || key === 'full_name') {
      return { wch: 28 }
    }
    if (key === 'team_name' || key === 'department' || key === 'team_code') {
      return { wch: 20 }
    }
    if (key === 'created_at') {
      return { wch: 24 }
    }
    return { wch: 14 }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Roster')

  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `AI-Odyssey-24-Roster-${stamp}.xlsx`)
}

/** Build and download payment proofs Excel (7 columns). */
export async function downloadPaymentsExcel(): Promise<void> {
  const payload = await fetchPaymentExport()
  const rows = payload.rows.map((row) => ({
    team_name: row.team_name ?? '',
    team_size: row.team_size ?? '',
    full_name: row.full_name ?? '',
    phone: row.phone ?? '',
    college: row.college ?? '',
    transaction_id: row.transaction_id ?? '',
    screenshot_url: row.screenshot_url ?? '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [...PAYMENT_COLUMN_ORDER],
  })
  applyLeftAlignment(worksheet)

  worksheet['!cols'] = PAYMENT_COLUMN_ORDER.map((key) => {
    if (key === 'screenshot_url') return { wch: 48 }
    if (key === 'college' || key === 'full_name' || key === 'team_name') {
      return { wch: 24 }
    }
    if (key === 'transaction_id') return { wch: 22 }
    return { wch: 14 }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments')

  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `AI-Odyssey-24-Payments-${stamp}.xlsx`)
}

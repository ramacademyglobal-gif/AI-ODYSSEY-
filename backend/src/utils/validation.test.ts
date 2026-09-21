import { describe, expect, it } from 'vitest'
import {
  asTrimmedString,
  generateHackerId,
  generateQrToken,
  generateTeamCode,
  isTeamSize,
  isUuid,
  isValidTeamCode,
  normalizeTeamCode,
  parseParticipantListQuery,
  validateAdminCheckin,
  validateAdminParticipantStatus,
  validateCreateParticipant,
  validateCreateTeam,
  validateJoinTeam,
  validateTeamRegistration,
  ValidationError,
} from './validation.js'

describe('asTrimmedString', () => {
  it('trims strings and rejects non-strings', () => {
    expect(asTrimmedString('  hi  ')).toBe('hi')
    expect(asTrimmedString(12)).toBe('')
    expect(asTrimmedString(null)).toBe('')
  })
})

describe('team helpers', () => {
  it('accepts only size 3 or 4', () => {
    expect(isTeamSize(3)).toBe(true)
    expect(isTeamSize(4)).toBe(true)
    expect(isTeamSize(2)).toBe(false)
    expect(isTeamSize(5)).toBe(false)
  })

  it('normalizes and validates team codes', () => {
    expect(normalizeTeamCode('  odyssey24-ab12  ')).toBe('ODYSSEY24-AB12')
    expect(isValidTeamCode('ODYSSEY24-AB12')).toBe(true)
    expect(isValidTeamCode('ODYSSEY24-ab12')).toBe(true)
    expect(isValidTeamCode('BAD-CODE')).toBe(false)
    expect(isValidTeamCode('ODYSSEY24-ABC')).toBe(false)
  })

  it('generates valid team codes and hacker ids', () => {
    expect(generateTeamCode()).toMatch(/^ODYSSEY24-[A-Z0-9]{4}$/)
    expect(generateHackerId()).toMatch(/^ODYSSEY-H-[A-Z0-9]{4}$/)
  })
it('generates qr tokens as uuids', () => {
    expect(isUuid(generateQrToken())).toBe(true)
  })
})

describe('isUuid', () => {
  it('validates uuid v4-like strings', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isUuid('not-a-uuid')).toBe(false)
  })
})

describe('validateCreateParticipant', () => {
  const valid = {
    full_name: 'Hari',
    email: 'hari@example.com',
    phone: '9876543210',
    college: 'KCET',
    department: 'CSE',
    year: '3rd Year',
  }

  it('accepts a valid payload', () => {
    expect(validateCreateParticipant(valid)).toMatchObject({
      full_name: 'Hari',
      email: 'hari@example.com',
    })
  })

  it('rejects missing fields', () => {
    expect(() => validateCreateParticipant({})).toThrow(ValidationError)
  })

  it('rejects invalid email and short phone', () => {
    expect(() =>
      validateCreateParticipant({ ...valid, email: 'bad', phone: '123' }),
    ).toThrow(ValidationError)
  })
})

describe('validateCreateTeam', () => {
  const leader = '550e8400-e29b-41d4-a716-446655440000'

  it('accepts valid create-team body', () => {
    expect(
      validateCreateTeam({
        team_name: 'nexus',
        team_size: 3,
        leader_participant_id: leader,
      }),
    ).toEqual({
      team_name: 'nexus',
      team_size: 3,
      leader_participant_id: leader,
    })
  })

  it('rejects invalid size and leader id', () => {
    expect(() =>
      validateCreateTeam({
        team_name: 'nexus',
        team_size: 2,
        leader_participant_id: 'x',
      }),
    ).toThrow(ValidationError)
  })
})

describe('validateJoinTeam', () => {
  it('accepts valid join body', () => {
    expect(
      validateJoinTeam({
        team_code: 'odyssey24-3nf8',
        participant_id: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ).toEqual({
      team_code: 'ODYSSEY24-3NF8',
      participant_id: '550e8400-e29b-41d4-a716-446655440000',
    })
  })

  it('rejects bad team codes', () => {
    expect(() =>
      validateJoinTeam({
        team_code: 'NOPE',
        participant_id: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ).toThrow(ValidationError)
  })
})

describe('validateTeamRegistration', () => {
  it('accepts a full team of 3', () => {
    const result = validateTeamRegistration({
      team_name: 'Nexus',
      team_size: 3,
      college: 'KCET',
      leader: {
        full_name: 'Leader One',
        email: 'lead@example.com',
        phone: '9876543210',
        department: 'CSE',
        year: '3rd Year',
        roll_number: '21CS001',
      },
      members: [
        {
          full_name: 'Member Two',
          department: 'CSE',
          year: '2nd Year',
          roll_number: '21CS002',
        },
        {
          full_name: 'Member Three',
          department: 'IT',
          year: '2nd Year',
          roll_number: '21IT003',
        },
      ],
    })
    expect(result.team_size).toBe(3)
    expect(result.members).toHaveLength(2)
    expect(result.leader.roll_number).toBe('21CS001')
  })

  it('rejects member 4 when size is 3', () => {
    expect(() =>
      validateTeamRegistration({
        team_name: 'Nexus',
        team_size: 3,
        college: 'KCET',
        leader: {
          full_name: 'Leader One',
          email: 'lead@example.com',
          phone: '9876543210',
          department: 'CSE',
          year: '3rd Year',
          roll_number: '21CS001',
        },
        members: [
          {
            full_name: 'Member Two',
            department: 'CSE',
            year: '2nd Year',
            roll_number: '21CS002',
          },
          {
            full_name: 'Member Three',
            department: 'IT',
            year: '2nd Year',
            roll_number: '21IT003',
          },
          {
            full_name: 'Member Four',
            department: 'CSE',
            year: '1st Year',
            roll_number: '21CS004',
          },
        ],
      }),
    ).toThrow(ValidationError)
  })
})


describe('admin validators', () => {
  it('requires qr_token for check-in', () => {
    expect(validateAdminCheckin({ qr_token: 'abc' })).toEqual({
      qr_token: 'abc',
    })
    expect(() => validateAdminCheckin({})).toThrow(ValidationError)
  })

  it('validates participant status transitions', () => {
    expect(validateAdminParticipantStatus({ status: 'cancelled' })).toEqual({
      status: 'CANCELLED',
    })
    expect(() =>
      validateAdminParticipantStatus({ status: 'BANNED' }),
    ).toThrow(ValidationError)
  })

  it('parses participant list query', () => {
    expect(
      parseParticipantListQuery({
        page: '2',
        pageSize: '10',
        search: ' nexus ',
        status: 'registered',
        year: '3rd Year',
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      search: 'nexus',
      status: 'REGISTERED',
      year: '3rd Year',
    })
  })

  it('rejects invalid pagination', () => {
    expect(() => parseParticipantListQuery({ page: '0' })).toThrow(
      ValidationError,
    )
    expect(() => parseParticipantListQuery({ pageSize: '99' })).toThrow(
      ValidationError,
    )
  })
})

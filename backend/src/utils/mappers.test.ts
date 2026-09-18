import { describe, expect, it } from 'vitest'
import {
  buildPublicTeam,
  deriveTeamStatus,
  toCreatedParticipant,
  toPublicParticipant,
} from './mappers.js'
import type { ParticipantRow, TeamMemberRow, TeamRow } from '../types/index.js'

const participant: ParticipantRow = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  hacker_id: 'ODYSSEY-H-ABCD',
  full_name: 'Hari',
  email: 'hari@example.com',
  phone: '9876543210',
  college: 'KCET',
  department: 'CSE',
  year: '3rd Year',
  status: 'REGISTERED',
  qr_token: '550e8400-e29b-41d4-a716-446655440001',
  created_at: '2026-09-16T00:00:00.000Z',
  updated_at: '2026-09-16T00:00:00.000Z',
}

describe('deriveTeamStatus', () => {
  it('marks size-3 teams complete at 3', () => {
    expect(deriveTeamStatus(3, 1)).toBe('WAITING')
    expect(deriveTeamStatus(3, 2)).toBe('WAITING')
    expect(deriveTeamStatus(3, 3)).toBe('COMPLETE')
  })

  it('marks size-4 teams complete at 3 and full at 4', () => {
    expect(deriveTeamStatus(4, 2)).toBe('WAITING')
    expect(deriveTeamStatus(4, 3)).toBe('COMPLETE')
    expect(deriveTeamStatus(4, 4)).toBe('FULL')
  })
})

describe('participant mappers', () => {
  it('maps public participant without qr_token', () => {
    const pub = toPublicParticipant(participant)
    expect(pub).not.toHaveProperty('qr_token')
    expect(pub.hacker_id).toBe('ODYSSEY-H-ABCD')
  })

  it('includes qr_token on create response', () => {
    expect(toCreatedParticipant(participant).qr_token).toBe(
      participant.qr_token,
    )
  })
})

describe('buildPublicTeam', () => {
  const team: TeamRow = {
    id: '650e8400-e29b-41d4-a716-446655440000',
    team_code: 'ODYSSEY24-3NF8',
    team_name: 'nexus',
    team_size: 3,
    member_count: 2,
    status: 'WAITING',
    leader_participant_id: participant.id,
    created_at: '2026-09-16T00:00:00.000Z',
    updated_at: '2026-09-16T00:00:00.000Z',
  }

  const members: Array<
    TeamMemberRow & {
      participants?: Pick<ParticipantRow, 'id' | 'full_name' | 'hacker_id'> | null
    }
  > = [
    {
      id: '1',
      team_id: team.id,
      participant_id: participant.id,
      role: 'LEADER',
      joined_at: '2026-09-16T00:00:00.000Z',
      participants: {
        id: participant.id,
        full_name: 'Hari',
        hacker_id: 'ODYSSEY-H-ABCD',
      },
    },
    {
      id: '2',
      team_id: team.id,
      participant_id: '750e8400-e29b-41d4-a716-446655440000',
      role: 'MEMBER',
      joined_at: '2026-09-16T01:00:00.000Z',
      participants: null,
    },
  ]

  it('builds public team with derived status and slots', () => {
    const pub = buildPublicTeam(team, members)
    expect(pub.team_name).toBe('nexus')
    expect(pub.member_count).toBe(2)
    expect(pub.available_slots).toBe(1)
    expect(pub.status).toBe('WAITING')
    expect(pub.leader?.hacker_id).toBe('ODYSSEY-H-ABCD')
    expect(pub.members[1]?.full_name).toBe('Unknown')
  })

  it('derives COMPLETE when filled', () => {
    const full = buildPublicTeam(
      { ...team, member_count: 3, team_size: 3 },
      [
        ...members,
        {
          id: '3',
          team_id: team.id,
          participant_id: '850e8400-e29b-41d4-a716-446655440000',
          role: 'MEMBER',
          joined_at: '2026-09-16T02:00:00.000Z',
          participants: {
            id: '850e8400-e29b-41d4-a716-446655440000',
            full_name: 'Vaira',
            hacker_id: 'ODYSSEY-H-MTW2',
          },
        },
      ],
    )
    expect(full.status).toBe('COMPLETE')
    expect(full.available_slots).toBe(0)
  })
})

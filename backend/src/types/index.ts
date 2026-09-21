export type TeamSize = 3 | 4;

export type TeamRole = "LEADER" | "MEMBER";

export type TeamStatus = "WAITING" | "COMPLETE" | "FULL";

export type ParticipantRow = {
  id: string;
  hacker_id: string;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  roll_number?: string | null;
  qr_token: string;
  status: string;
  created_at: string;
  updated_at: string;
  payment_txn_id?: string | null;
  payment_drive_file_id?: string | null;
  payment_drive_file_url?: string | null;
  payment_verified_at?: string | null;
};

export type TeamRow = {
  id: string;
  team_code: string;
  team_name: string;
  team_size: number;
  member_count: number;
  leader_participant_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TeamMemberRow = {
  id: string;
  team_id: string;
  participant_id: string;
  role: TeamRole;
  joined_at: string;
};

export type CreateParticipantInput = {
  full_name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  roll_number?: string;
  payment_txn_id?: string;
  payment_drive_file_id?: string;
  payment_drive_file_url?: string;
  payment_verified_at?: string;
};

export type TeamMemberProfileInput = {
  full_name: string;
  department: string;
  year: string;
  roll_number: string;
};

export type TeamRegistrationInput = {
  team_name: string;
  team_size: TeamSize;
  college: string;
  leader: CreateParticipantInput & { roll_number: string };
  members: TeamMemberProfileInput[];
};

export type CreateTeamInput = {
  team_name: string;
  team_size: number;
  leader_participant_id: string;
};

export type JoinTeamInput = {
  team_code: string;
  participant_id: string;
};

export type PublicParticipant = {
  id: string;
  hacker_id: string;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  status: string;
  created_at: string;
};

export type PublicTeamMember = {
  participant_id: string;
  full_name: string;
  hacker_id: string;
  role: TeamRole;
  joined_at: string;
};

export type PublicTeam = {
  team_code: string;
  team_name: string;
  team_size: number;
  member_count: number;
  available_slots: number;
  status: string;
  leader: {
    participant_id: string;
    full_name: string;
    hacker_id: string;
  } | null;
  members: PublicTeamMember[];
};

import type { EventConfig } from "@/registration/types/event";

export const EVENT_CONFIG = {
  id: 'ai-odyssey-24',
  name: 'AI ODYSSEY 24',
  tagline: '24 HOURS. ONE MISSION. INFINITE AI POSSIBILITIES.',
  registration: {
    mode: 'individual',
    soloParticipationAllowed: false,
    requiresTeam: true,
    allowedTeamSizes: [3, 4],
    teamSizeLockedAfterCreation: true,
    creatorSelectsTeamSize: true,
  },
  teamCode: {
    prefix: 'ODYSSEY24',
    segmentLength: 4,
    formatLabel: 'ODYSSEY24-XXXX',
    pattern: /^ODYSSEY24-[A-Z0-9]{4}$/,
  },
  rules: [
    'Individual registration one form per participant.',
    'Solo participation is not allowed; every participant must belong to a team.',
    'Team size must be exactly 3 or 4 members.',
    'The first participant to create a team chooses whether the team has 3 or 4 slots.',
    'Team size is locked after the team is created.',
    'Share your team code (ODYSSEY24-XXXX) so teammates can join.',
  ],
  payment: {
    qrImageSrc: '/payment-qr.png',
    heading: 'SCAN TO PAY',
    amountPerPerson: 100,
    notices: [
      'Fee: ₹100 per person.',
      'Team of 3 members = ₹300 total for the team.',
      'Team of 4 members = ₹400 total for the team.',
      'Only individual payments are allowed. No group/combined UPI payments.',
      'Each payment covers one participant registration.',
      'Payments are non-refundable.',
    ],
  },
  whatsapp: {
    groupUrl: 'https://chat.whatsapp.com/JoM4FkXECZHFiCgJ9S573i?mode=gi_t',
    label: 'JOIN WHATSAPP GROUP',
  },
} as const satisfies EventConfig

import type { EventConfig } from "@/registration/types/event";

export const EVENT_CONFIG = {
  id: 'ai-odyssey-24',
  name: 'AI ODYSSEY 24',
  tagline: '24 HOURS. ONE MISSION. INFINITE AI POSSIBILITIES.',
  registration: {
    mode: 'team',
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
    'One registration per team — all members are entered in a single form.',
    'Solo participation is not allowed; every team must have 3 or 4 members.',
    'Team size must be exactly 3 or 4 members.',
    'College is shared by the whole team.',
    'Only the Team Leader provides email and phone (primary contact).',
    'One combined payment covers the whole team (₹100 × members).',
  ],
  payment: {
    qrImageSrc: '/payment-qr.png',
    heading: 'SCAN TO PAY',
    amountPerPerson: 100,
    notices: [
      'Fee: ₹100 per person.',
      'Team of 3 members = ₹300 total (one payment).',
      'Team of 4 members = ₹400 total (one payment).',
      'Pay the full team amount in one UPI transfer.',
      'Upload one payment screenshot showing ₹300 or ₹400 and the Transaction ID / UTR (light or dark mode OK).',
      'Payments are non-refundable.',
    ],
  },
  whatsapp: {
    groupUrl: 'https://chat.whatsapp.com/JoM4FkXECZHFiCgJ9S573i?mode=gi_t',
    label: 'JOIN WHATSAPP GROUP',
  },
} as const satisfies EventConfig

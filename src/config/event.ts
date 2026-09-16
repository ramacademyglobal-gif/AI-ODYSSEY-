export interface EventEligibility {
  categories: string[];
  crossCollegeTeamsAllowed: boolean | null;
  crossDepartmentTeamsAllowed: boolean | null;
  individualParticipationAllowed: boolean | null;
  previousAIExperienceRequired: boolean | null;
  minTeamSize: number;
  maxTeamSize: number;
}

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  discord?: string;
  github?: string;
}

export interface ContactChannel {
  role: string;
  name: string;
  email: string;
  phone?: string;
}

export interface EventConfig {
  eventName: string;
  shortName: string;
  tagline: string;
  description: string;
  eventStart: string | null;
  eventEnd: string | null;
  checkInStart: string | null;
  checkInEnd: string | null;
  registrationOpen: string | null;
  registrationDeadline: string | null;
  googleFormRegistrationUrl: string;
  venueName: string | null;
  venueAddress: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  teamMin: number;
  teamMax: number;
  registrationFee: string | null;
  expectedParticipants: number | null;
  expectedTeams: number | null;
  challengeCount: number | null;
  prizePool: string | null;
  organizer: string;
  eligibility: EventEligibility;
  socialLinks: SocialLinks;
  contacts: ContactChannel[];
  participantBenefits: string[];
  rulesHighlights: string[];
  aiToolPolicyHighlights: string[];
  participantGuideUrl: string | null;
  sponsorDeckUrl: string | null;
}

export const EVENT_CONFIG: EventConfig = {
  eventName: "AI Odyssey 24",
  shortName: "AI ODYSSEY 24",
  tagline: "24 HOURS. ONE MISSION. INFINITE AI POSSIBILITIES.",
  description:
    "A 24-hour innovation challenge bringing together builders, thinkers and creators to turn ambitious ideas into meaningful working solutions.",

  eventStart: "2026-09-28T10:00:00+05:30",
  eventEnd: "2026-09-29T10:00:00+05:30",
  checkInStart: "2026-09-28T09:00:00+05:30",
  checkInEnd: "2026-09-28T10:00:00+05:30",
  registrationOpen: "2026-09-01T00:00:00+05:30",
  registrationDeadline: "2026-09-27T23:59:59+05:30",

  googleFormRegistrationUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSc3Q9zYlCYFIVPGY02tZSwfRTgAu-hrsiwzT3DSRjBe89oHsg/viewform",

  venueName: "Ramco Institute of Technology",
  venueAddress: null,
  city: "Rajapalayam",
  state: "Tamil Nadu",
  country: "India",

  teamMin: 3,
  teamMax: 4,
  registrationFee: "₹100 per person",
  expectedParticipants: null,
  expectedTeams: null,
  challengeCount: 10,
  prizePool: null,
  organizer:
    "Ramco Institute of Technology with ACM, CSI, IIC, Student Chapter and Raam TechLink Pvt. Ltd.",

  eligibility: {
    categories: [
      "Undergraduate Students (B.E / B.Tech / B.Sc / BCA)",
      "Postgraduate Students (M.E / M.Tech / M.Sc / MCA)",
      "Polytechnic & Diploma Scholars",
    ],
    crossCollegeTeamsAllowed: false,
    crossDepartmentTeamsAllowed: true,
    individualParticipationAllowed: false,
    previousAIExperienceRequired: false,
    minTeamSize: 3,
    maxTeamSize: 4,
  },

  socialLinks: {
    instagram: "https://www.instagram.com/ai_odyssey_2026?stkn=MWpmbWFpOHRiZnhnMw==",
    linkedin: "https://www.linkedin.com/school/ramco-institute-of-technology/",
  },

  contacts: [
    {
      role: "General & Registration",
      name: "Odyssey Desk",
      email: "ramacademy.global@gmail.com",
    },
  ],

  participantBenefits: [
    "Build a real solution under a focused 24-hour window",
    "Learn from mentors and industry practitioners",
    "Collaborate across departments within your institution",
    "Showcase your skills before a jury",
    "Compete for recognition and prizes",
    "Network with peers, organizers and partners",
    "Earn an official certificate of participation",
    "Food, snacks and refreshments throughout the event",
  ],

  rulesHighlights: [
    "All code and solutions must be created during the 24-hour hackathon window.",
    "Teams must consist of 3 to 4 members. Individual registration is not allowed.",
    "Cross-college teams are not permitted. Cross-department teams are encouraged.",
    "Generative AI tools are permitted as assistants; submitted work must be original.",
    "Submissions must include a working prototype and supporting materials as required.",
  ],

  aiToolPolicyHighlights: [
    "LLM assistants are ALLOWED for ideation, debugging and code assistance.",
    "AI coding agents are ALLOWED.",
    "Open-source pretrained models are ALLOWED.",
    "Submitting pre-existing full applications is STRICTLY PROHIBITED.",
  ],

  participantGuideUrl: null,
  sponsorDeckUrl: null,
};

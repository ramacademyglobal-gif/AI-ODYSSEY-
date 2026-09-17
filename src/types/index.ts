export type ChallengeSector =
  | "Financial Sector"
  | "Healthcare Sector"
  | "Smart City Sector"
  | "Education Sector"
  | "Agriculture Sector";

export type ChallengeCategoryType = "Software" | "IoT";

export interface Challenge {
  id: string;
  number: number;
  slug: string;
  sector: ChallengeSector;
  category: ChallengeCategoryType;
  title: string;
  description: string;
  track?: string;
  difficulty?: string;
  shortDescription?: string;
  problemStatement?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  location?: string;
  phase: "before" | "live";
  day?: 1 | 2;
  date?: string;
  category?: "checkpoint" | "keynote" | "evaluation" | "food" | "fun" | "deadline" | "registration" | "briefing" | "ideation" | "build" | "presentation";
  highlight?: boolean;
  /** Student-facing public timeline only — omit detailed build/ops phases from UI */
  isPublicTimeline?: boolean;
}

export interface Person {
  id: string;
  name: string;
  role: "mentor" | "jury" | "both";
  designation: string;
  company: string;
  avatarUrl?: string;
  expertise: string[];
  bio?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  tier: "Title" | "Powered By" | "Platinum" | "Gold" | "Silver" | "Technology" | "Cloud" | "Community" | "Goodie" | "Media";
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
}

export interface JudgingCriterion {
  id: string;
  title: string;
  description: string;
  weightage?: string; // e.g. "25%" or TBA
  iconName: string;
}

export interface EvaluationStage {
  step: string;
  name: string;
  description: string;
  timeframe: string;
}

export interface PrizeItem {
  id: string;
  category: "Main Track" | "Special Category" | "Perks";
  title: string;
  subtitle?: string;
  amount?: string;
  perks: string[];
  iconName: string;
  rank?: number;
}

export interface Announcement {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  isUrgent?: boolean;
  author?: string;
}

export interface Winner {
  id: string;
  rank: string;
  teamName: string;
  college: string;
  projectTitle: string;
  challengeTitle: string;
  track: string;
  members: string[];
  demoUrl?: string;
  githubUrl?: string;
  award: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: "All" | "Opening" | "Building" | "Mentoring" | "Midnight" | "Final Pitches" | "Awards";
  imageUrl: string;
  caption?: string;
}

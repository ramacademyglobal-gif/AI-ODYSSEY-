export interface Organizer {
  id: string;
  name: string;
  shortName?: string;
  role: string;
  logo: string;
  websiteUrl?: string | null;
  description?: string | null;
}

/**
 * Official organizing bodies for AI Odyssey 24.
 * These are organizers — not sponsors.
 */
export const ORGANIZERS: Organizer[] = [
  {
    id: "acm",
    name: "Association for Computing Machinery",
    shortName: "ACM",
    role: "Professional Body",
    logo: "/branding/organizers/acm.png",
    websiteUrl: null,
    description: null,
  },
  {
    id: "csi",
    name: "Computer Society of India",
    shortName: "CSI",
    role: "Professional Society",
    logo: "/branding/organizers/csi.png",
    websiteUrl: null,
    description: null,
  },
  {
    id: "iic",
    name: "Institution's Innovation Council",
    shortName: "IIC",
    role: "Innovation Council",
    logo: "/branding/organizers/iic.png",
    websiteUrl: null,
    description: null,
  },
  {
    id: "rit-student-chapter",
    name: "Student Chapter, Ramco Institute of Technology",
    shortName: "Student Chapter",
    role: "Student Chapter",
    logo: "/branding/organizers/rit-student-chapter.jpg",
    websiteUrl: null,
    description: null,
  },
  {
    id: "raam-techlink",
    name: "Raam TechLink Pvt. Ltd.",
    shortName: "Raam TechLink",
    role: "Industry Organizer",
    logo: "/branding/organizers/raam-techlink.png",
    websiteUrl: null,
    description: null,
  },
  {
    id: "rit",
    name: "Ramco Institute of Technology",
    shortName: "RIT",
    role: "Host Institution",
    logo: "/branding/organizers/rit.png",
    websiteUrl: null,
    description: null,
  },
];

import { Sponsor } from "@/types";

// Official confirmed sponsors will be updated here.
// When empty, components render the Partnership Invitation & Deck request section.
export const SPONSORS: Sponsor[] = [];

export interface SponsorBenefit {
  title: string;
  description: string;
  icon: string;
}

export const SPONSOR_BENEFITS: SponsorBenefit[] = [
  {
    title: "Access Top AI Student Talent",
    description: "Connect directly with 500+ top engineering, CS, and AI researchers across colleges for internships and full-time hiring.",
    icon: "Users"
  },
  {
    title: "Brand & Mission Visibility",
    description: "Feature your brand logo across event livestreams, stage banners, developer badges, and national digital media campaigns.",
    icon: "Target"
  },
  {
    title: "Developer API & Cloud Adoption",
    description: "Provide cloud API credits, SDK tools, or hardware to participating teams to drive hands-on adoption of your tech stack.",
    icon: "Zap"
  },
  {
    title: "Drive Real-World AI Innovation",
    description: "Sponsor a custom problem statement track aligned with your industry goals and evaluate working prototype solutions.",
    icon: "Lightbulb"
  }
];

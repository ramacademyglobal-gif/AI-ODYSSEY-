import { PrizeItem } from "@/types";

// Official podium rewards — no cash amounts announced yet.
export const PRIZES: PrizeItem[] = [
  {
    id: "PZ-01",
    category: "Main Track",
    title: "Winner",
    subtitle: "Overall 1st Place",
    rank: 1,
    iconName: "Trophy",
    perks: ["Internship Opportunity", "Exciting Prize"],
  },
  {
    id: "PZ-02",
    category: "Main Track",
    title: "First Runner-Up",
    subtitle: "Overall 2nd Place",
    rank: 2,
    iconName: "Medal",
    perks: ["Internship Opportunity", "Exciting Prize"],
  },
  {
    id: "PZ-03",
    category: "Main Track",
    title: "Second Runner-Up",
    subtitle: "Overall 3rd Place",
    rank: 3,
    iconName: "Award",
    perks: ["Internship Opportunity", "Exciting Prize"],
  },
];

export const PARTICIPANT_PERKS = [
  {
    title: "Official Certificate of Innovation",
    description:
      "Verified digital credential for every participating student team that completes the 24-hour hackathon.",
    icon: "FileCheck",
  },
  {
    title: "24-Hour Hospitality & Meals",
    description: "Food, snacks, and refreshments provided throughout the event.",
    icon: "Coffee",
  },
];

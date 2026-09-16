import { JudgingCriterion, EvaluationStage } from "@/types";

export const JUDGING_CRITERIA: JudgingCriterion[] = [
  {
    id: "JC-01",
    title: "Problem Understanding & Feasibility",
    description: "Depth of domain problem analysis, clarity of scope, and real-world applicability of the proposed approach.",
    iconName: "Compass"
  },
  {
    id: "JC-02",
    title: "Innovation & Originality",
    description: "Uniqueness of the AI solution, novelty of architecture, and creative problem-solving beyond standard approaches.",
    iconName: "Sparkles"
  },
  {
    id: "JC-03",
    title: "Technical Implementation & Code Quality",
    description: "Robustness of system architecture, efficient API integration, code structure, error handling, and performance.",
    iconName: "Code2"
  },
  {
    id: "JC-04",
    title: "AI Relevance & Model Execution",
    description: "Meaningful integration of AI models, agents, RAG, or computer vision workflows that genuinely solve the core problem.",
    iconName: "Brain"
  },
  {
    id: "JC-05",
    title: "Impact, Usability & Scalability",
    description: "Measurable potential impact, clean user experience / UI design, and production readiness for real deployment.",
    iconName: "TrendingUp"
  },
  {
    id: "JC-06",
    title: "Working Prototype & Final Pitch",
    description: "Completeness of live working software demonstration and quality of team communication during the final pitch.",
    iconName: "Presentation"
  }
];

export const EVALUATION_STAGES: EvaluationStage[] = [
  {
    step: "01",
    name: "Mentor Checkpoints",
    description: "Table-side feedback from industry mentors at 3:00 PM and 10:30 PM to refine project architecture and demo strategy.",
    timeframe: "Day 1 • Afternoon & Evening"
  },
  {
    step: "02",
    name: "Preliminary Evaluation",
    description: "Jury review of working prototypes at team desks. Teams demonstrate core feature loops and GitHub repository structure.",
    timeframe: "Day 1 • 6:00 PM & Day 2 • 10:30 AM"
  },
  {
    step: "03",
    name: "Shortlist Announcement",
    description: "Jury panel synthesizes track scores to announce the Top 8 Odyssey Finalist teams invited to the Main Stage.",
    timeframe: "Day 2 • 1:00 PM"
  },
  {
    step: "04",
    name: "Final Pitch Deck",
    description: "Top 8 finalists pitch live (5 min demo + 3 min Q&A) in front of all participants and the grand jury panel.",
    timeframe: "Day 2 • 1:30 PM"
  },
  {
    step: "05",
    name: "Odyssey Champions",
    description: "Scores tallied live. Announcement of Overall Winners, Track Winners, and Special Innovation Award recipients.",
    timeframe: "Day 2 • 3:00 PM"
  }
];

export const ACHIEVEMENT_IDS = [
  "first_song",
  "first_ready_song",
  "first_report",
  "score_80",
  "score_90",
  "songs_3",
  "plays_50",
  "shares_10",
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
}

export const achievements: AchievementDefinition[] = [
  {
    id: "first_song",
    title: "First Draft",
    description: "Create your first song idea.",
  },
  {
    id: "first_ready_song",
    title: "First Release",
    description: "Generate audio for your first ready song.",
  },
  {
    id: "first_report",
    title: "Producer Notes",
    description: "Generate your first judge report.",
  },
  {
    id: "score_80",
    title: "Strong Signal",
    description: "Earn a report score of 80 or higher.",
  },
  {
    id: "score_90",
    title: "Hit Potential",
    description: "Earn a report score of 90 or higher.",
  },
  {
    id: "songs_3",
    title: "Three-Song Run",
    description: "Create at least three songs.",
  },
  {
    id: "plays_50",
    title: "First Audience",
    description: "Reach 50 total plays across your songs.",
  },
  {
    id: "shares_10",
    title: "Worth Sharing",
    description: "Reach 10 total shares across your songs.",
  },
];

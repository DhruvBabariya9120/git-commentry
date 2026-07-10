export interface MatchStats {
  login: string;
  name: string | null;
  avatarUrl: string;
  accountAgeYears: number;
  followers: number;
  publicRepos: number;
  totalStars: number;
  totalContributions: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  longestStreak: number;
  currentStreak: number;
  busiestDay: { date: string; count: number };
  topLanguages: { name: string; percent: number }[];
  nightOwlPercent: number;
}

export interface CommentarySegment {
  minute: string;
  title: string;
  text: string;
}

export interface PlayerCard {
  position: string;
  rating: number;
  playingStyle: string;
  signatureMove: string;
  topSkills: string[];
}

export interface Commentary {
  segments: CommentarySegment[];
  playerCard: PlayerCard;
}

export type ApiErrorCode =
  | "USER_NOT_FOUND"
  | "RATE_LIMITED"
  | "COMMENTARY_FAILED"
  | "BAD_REQUEST"
  | "UPSTREAM";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

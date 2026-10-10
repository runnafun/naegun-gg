export type PublicScrimStatus =
  | "OPEN"
  | "CLOSED"
  | "TEAM_SELECTION"
  | "IN_PROGRESS"
  | "FINISHED"
  | "CANCELLED";

export type PublicScrimParticipant = {
  userId: string;

  riotId: string | null;

  puuid: string | null;

  gameName: string | null;
  tagLine: string | null;
  profileIconId: number | null;

  currentTier: string | null;
  currentRank: string | null;
  currentLp: number | null;

  peakTier: string | null;
  peakRank: string | null;
  peakLp: number | null;

  tierEvaluation: number | null;
  scrimRankScore: number;

  wins: number;
  losses: number;

  mainPosition: string;
  subPosition: string;
  team: "A" | "B" | null;
  status: string;
};

export type PublicScrim = {
  id: string;
  code: string;
  type: "NORMAL" | "RANKED";
  rule: string;
  status: PublicScrimStatus;
  bestOf: number;
  startAt: string;
  maxPlayers: number;
  participantCount: number;
  waitingCount: number;
  forumThreadId: string | null;
  starterMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  participants?: PublicScrimParticipant[];
};

export type ScrimListResponse = {
  items: PublicScrim[];
  total: number;
  generatedAt: string;
};

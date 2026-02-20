export interface League {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  createdAt: number;
  assistedMode: boolean;
  memberCount: number;
}

export interface LeagueMember {
  playerId: string;
  displayName: string;
  joinedAt: number;
  wins: number;
  losses: number;
  totalGuessesInWins: number;
  lastMatchAt: number;
}

export interface LeagueStanding extends LeagueMember {
  rank: number;
  winRate: number; // 0.0 - 1.0
}

export interface LeagueListItem {
  league: League;
  myStats: LeagueMember;
}

export interface LeagueMatch {
  id: string;
  winnerId: string;
  loserId: string;
  winnerName: string;
  loserName: string;
  reason: 'guessed' | 'disconnect' | 'forfeit';
  winnerGuessCount: number | null;
  timestamp: number;
}

export interface LeagueChallenge {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  leagueId: string;
  assistedMode: boolean;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  gameId: string | null;
  timestamp: number;
}

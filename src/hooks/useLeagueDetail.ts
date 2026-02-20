import { useState, useEffect } from 'react';
import { getPlayerId } from '../services/playerIdentity';
import { getLeague, listenToLeagueMembers, listenToLeagueMatches } from '../services/league';
import { League, LeagueMember, LeagueStanding, LeagueMatch } from '../types/league';

export function useLeagueDetail(leagueId: string) {
  const [league, setLeague] = useState<League | null>(null);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load league info once + get playerId
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pid = getPlayerId();
      const leagueData = await getLeague(leagueId);
      if (cancelled) return;
      setLeague(leagueData);
      setMyPlayerId(pid);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [leagueId]);

  // Real-time standings
  useEffect(() => {
    const unsub = listenToLeagueMembers(leagueId, (members: LeagueMember[]) => {
      const withStats: LeagueStanding[] = members.map((m) => {
        const total = m.wins + m.losses;
        const winRate = total > 0 ? m.wins / total : 0;
        return { ...m, rank: 0, winRate };
      });

      // Sort: win rate desc, then avg guesses asc (lower = better)
      withStats.sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        const aAvg = a.wins > 0 ? a.totalGuessesInWins / a.wins : Infinity;
        const bAvg = b.wins > 0 ? b.totalGuessesInWins / b.wins : Infinity;
        return aAvg - bAvg;
      });

      withStats.forEach((s, i) => { s.rank = i + 1; });

      setStandings(withStats);
    });

    return unsub;
  }, [leagueId]);

  // Real-time recent matches
  useEffect(() => {
    const unsub = listenToLeagueMatches(leagueId, setMatches);
    return unsub;
  }, [leagueId]);

  return { league, standings, matches, myPlayerId, loading };
}

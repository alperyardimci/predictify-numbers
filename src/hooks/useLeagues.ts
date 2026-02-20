import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getPlayerId } from '../services/playerIdentity';
import { getMyLeagues } from '../services/league';
import { LeagueListItem } from '../types/league';

export function useLeagues() {
  const [leagues, setLeagues] = useState<LeagueListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const playerId = getPlayerId();
      const items = await getMyLeagues(playerId);
      // Sort by most recent match first, then by join date
      items.sort((a, b) => {
        const aTime = a.myStats.lastMatchAt || a.myStats.joinedAt;
        const bTime = b.myStats.lastMatchAt || b.myStats.joinedAt;
        return bTime - aTime;
      });
      setLeagues(items);
    } catch (err) {
      console.error('[useLeagues] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { leagues, loading, reload: load };
}

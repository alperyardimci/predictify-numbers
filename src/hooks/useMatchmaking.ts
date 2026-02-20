import { useState, useEffect, useRef, useCallback } from 'react';
import { getPlayerId } from '../services/playerIdentity';
import {
  joinQueue,
  leaveQueue,
  listenForMatch,
  tryMatchWithOpponent,
  cleanStaleEntries,
  clearNotification,
} from '../services/matchmaking';
import { PlayerSlot } from '../types/online';

type MatchmakingStatus = 'idle' | 'searching' | 'found' | 'error';

interface MatchResult {
  gameId: string;
  mySlot: PlayerSlot;
}

export function useMatchmaking() {
  const [status, setStatus] = useState<MatchmakingStatus>('idle');
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const entryKeyRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
      // Leave queue on unmount if still searching
      if (entryKeyRef.current) {
        leaveQueue(entryKeyRef.current).catch(() => {});
      }
      // Clear notification
      if (playerIdRef.current) {
        clearNotification(playerIdRef.current).catch(() => {});
      }
    };
  }, [cleanup]);

  const startSearching = useCallback(async (assistedMode: boolean, leagueId?: string) => {
    try {
      setStatus('searching');
      setError(null);
      setMatch(null);

      const playerId = getPlayerId();
      playerIdRef.current = playerId;
      console.log('[Matchmaking] Player ID:', playerId);

      // Clean stale entries first
      await cleanStaleEntries();

      // Clear any old notifications
      await clearNotification(playerId);

      // Join the queue
      const entryKey = await joinQueue(playerId, assistedMode, leagueId);
      entryKeyRef.current = entryKey;
      console.log('[Matchmaking] Joined queue with key:', entryKey);

      if (!mountedRef.current) {
        leaveQueue(entryKey).catch(() => {});
        return;
      }

      // Listen for match notification (in case someone else matches us)
      unsubscribeRef.current = listenForMatch(playerId, (gameId, slot) => {
        console.log('[Matchmaking] Match notification received:', gameId, slot);
        if (!mountedRef.current) return;
        cleanup();
        entryKeyRef.current = null;
        setMatch({ gameId, mySlot: slot });
        setStatus('found');
        clearNotification(playerId).catch(() => {});
      });

      // Periodically try to find an opponent ourselves
      const poll = async () => {
        if (!mountedRef.current || !entryKeyRef.current) return;
        try {
          console.log('[Matchmaking] Polling for opponent...');
          const result = await tryMatchWithOpponent(playerId, entryKeyRef.current, assistedMode, leagueId);
          console.log('[Matchmaking] Poll result:', result);
          if (result && mountedRef.current) {
            cleanup();
            entryKeyRef.current = null;
            setMatch({ gameId: result.gameId, mySlot: result.slot });
            setStatus('found');
          }
        } catch (pollErr) {
          console.log('[Matchmaking] Poll error:', pollErr);
        }
      };

      // Try immediately
      await poll();

      // Then poll every 2 seconds
      if (mountedRef.current && entryKeyRef.current) {
        pollIntervalRef.current = setInterval(poll, 2000);
      }
    } catch (err) {
      console.log('[Matchmaking] Error:', err);
      if (mountedRef.current) {
        setStatus('error');
        setError('Bağlantı hatası. Tekrar deneyin.');
      }
    }
  }, [cleanup]);

  const cancelSearching = useCallback(async () => {
    cleanup();
    if (entryKeyRef.current) {
      try {
        await leaveQueue(entryKeyRef.current);
      } catch {}
      entryKeyRef.current = null;
    }
    if (playerIdRef.current) {
      clearNotification(playerIdRef.current).catch(() => {});
    }
    setStatus('idle');
    setMatch(null);
  }, [cleanup]);

  return {
    status,
    match,
    error,
    startSearching,
    cancelSearching,
  };
}

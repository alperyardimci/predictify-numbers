import { useState, useEffect, useRef, useCallback } from 'react';
import { auth } from '../services/firebase';
import {
  joinQueue,
  leaveQueue,
  listenForMatch,
  tryMatchWithOpponent,
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
      if (entryKeyRef.current) {
        leaveQueue(entryKeyRef.current).catch(() => {});
      }
      clearNotification().catch(() => {});
    };
  }, [cleanup]);

  const startSearching = useCallback(async (assistedMode: boolean, leagueId?: string) => {
    try {
      setStatus('searching');
      setError(null);
      setMatch(null);

      const playerId = auth.currentUser!.uid;
      console.log('[Matchmaking] Player ID:', playerId);

      // Clear any old notifications
      await clearNotification();

      // Join the queue (no playerId param — server uses auth.uid)
      const entryKey = await joinQueue(assistedMode, leagueId);
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
        clearNotification().catch(() => {});
      });

      // Periodically try to find an opponent ourselves
      const poll = async () => {
        if (!mountedRef.current || !entryKeyRef.current) return;
        try {
          console.log('[Matchmaking] Polling for opponent...');
          const result = await tryMatchWithOpponent(entryKeyRef.current, assistedMode, leagueId);
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
    clearNotification().catch(() => {});
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

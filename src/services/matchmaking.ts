import { ref, onValue, off } from 'firebase/database';
import { database } from './firebase';
import { PlayerSlot, MatchmakingEntry } from '../types/online';
import {
  joinQueueFn,
  leaveQueueFn,
  tryMatchFn,
  clearNotificationFn,
} from './cloudFunctions';

/**
 * Join the matchmaking queue via Cloud Function. Returns the entry key.
 */
export async function joinQueue(assistedMode: boolean, leagueId?: string): Promise<string> {
  const result = await joinQueueFn({ assistedMode, leagueId });
  return result.data.entryKey;
}

/**
 * Leave the matchmaking queue via Cloud Function.
 */
export async function leaveQueue(entryKey: string): Promise<void> {
  await leaveQueueFn({ entryKey });
}

/**
 * Listen for a match notification for this player.
 * Returns an unsubscribe function.
 */
export function listenForMatch(
  playerId: string,
  onMatch: (gameId: string, slot: PlayerSlot) => void
): () => void {
  const notifRef = ref(database, `playerNotifications/${playerId}`);
  const unsubscribe = onValue(notifRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.gameId) {
      onMatch(data.gameId, data.slot);
    }
  });

  return () => off(notifRef);
}

/**
 * Try to match with an opponent via Cloud Function.
 */
export async function tryMatchWithOpponent(
  entryKey: string,
  assistedMode: boolean,
  leagueId?: string
): Promise<{ gameId: string; slot: PlayerSlot } | null> {
  const result = await tryMatchFn({ entryKey, assistedMode, leagueId });
  const data = result.data;

  if (!data.matched || !data.gameId || !data.slot) {
    return null;
  }

  return { gameId: data.gameId, slot: data.slot as PlayerSlot };
}

/**
 * Listen for real-time queue counts grouped by assistedMode.
 * Filters out stale entries (>60s). Returns an unsubscribe function.
 */
export function listenForQueueCounts(
  onCounts: (counts: { assisted: number; unassisted: number }) => void
): () => void {
  const queueRef = ref(database, 'matchmaking');
  onValue(queueRef, (snapshot) => {
    let assisted = 0;
    let unassisted = 0;
    const data = snapshot.val() as Record<string, MatchmakingEntry> | null;
    if (data) {
      const now = Date.now();
      for (const entry of Object.values(data)) {
        if (now - entry.timestamp > 60000) continue;
        if (entry.assistedMode) {
          assisted++;
        } else {
          unassisted++;
        }
      }
    }
    onCounts({ assisted, unassisted });
  });

  return () => off(queueRef);
}

/**
 * Clear player notification via Cloud Function.
 */
export async function clearNotification(): Promise<void> {
  await clearNotificationFn();
}

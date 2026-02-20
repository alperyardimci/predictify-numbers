import {
  ref,
  push,
  set,
  remove,
  onValue,
  get,
  off,
  runTransaction,
} from 'firebase/database';
import { database } from './firebase';
import { generateNumber } from '../utils/gameLogic';
import { PlayerSlot, OnlineGameRoom, MatchmakingEntry } from '../types/online';

/**
 * Join the matchmaking queue. Returns the entry key so we can cancel later.
 */
export async function joinQueue(playerId: string, assistedMode: boolean, leagueId?: string): Promise<string> {
  const queueRef = ref(database, 'matchmaking');
  const newEntryRef = push(queueRef);
  await set(newEntryRef, {
    playerId,
    timestamp: Date.now(),
    assistedMode,
    leagueId: leagueId || null,
  });
  return newEntryRef.key!;
}

/**
 * Leave the matchmaking queue.
 */
export async function leaveQueue(entryKey: string): Promise<void> {
  const entryRef = ref(database, `matchmaking/${entryKey}`);
  await remove(entryRef);
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
 * Scan the queue for another waiting player and create a game.
 * Uses a transaction on the entire queue to atomically claim both entries,
 * preventing the race condition where both players create separate games.
 */
export async function tryMatchWithOpponent(
  myPlayerId: string,
  myEntryKey: string,
  assistedMode: boolean,
  leagueId?: string
): Promise<{ gameId: string; slot: PlayerSlot } | null> {
  const queueRef = ref(database, 'matchmaking');

  // Find and claim opponent atomically
  let claimedOpponentId: string | null = null;

  const txResult = await runTransaction(queueRef, (queue: Record<string, MatchmakingEntry> | null) => {
    if (!queue) return queue;

    // Verify our own entry still exists (someone else may have claimed us)
    if (!queue[myEntryKey] || queue[myEntryKey].playerId !== myPlayerId) {
      return; // abort — we were already claimed
    }

    // Find an opponent (not ourselves, not too old, same mode, same league)
    const now = Date.now();
    let foundKey: string | null = null;
    let foundId: string | null = null;

    for (const [key, entry] of Object.entries(queue)) {
      if (key === myEntryKey) continue;
      if (entry.playerId === myPlayerId) continue;
      if (now - entry.timestamp > 60000) continue;
      if (!!entry.assistedMode !== assistedMode) continue;
      if ((entry.leagueId || null) !== (leagueId || null)) continue;
      foundKey = key;
      foundId = entry.playerId;
      break;
    }

    if (!foundKey || !foundId) {
      return; // abort — no opponent available
    }

    // Remove both entries atomically
    claimedOpponentId = foundId;
    delete queue[myEntryKey];
    delete queue[foundKey];
    return queue;
  });

  if (!txResult.committed || !claimedOpponentId) {
    return null;
  }

  const opponentId = claimedOpponentId;
  console.log('[Matchmaking:try] Atomically claimed match with:', opponentId);

  // Create the game room
  const gameId = await createGameRoom(myPlayerId, opponentId, assistedMode, leagueId);
  console.log('[Matchmaking:try] Game created:', gameId);

  // Notify the opponent
  await set(ref(database, `playerNotifications/${opponentId}`), {
    gameId,
    slot: 'player2',
  });
  console.log('[Matchmaking:try] Opponent notified');

  return { gameId, slot: 'player1' as PlayerSlot };
}

/**
 * Create a new game room with a secret 6-digit number.
 */
async function createGameRoom(player1Id: string, player2Id: string, assistedMode: boolean, leagueId?: string): Promise<string> {
  const gamesRef = ref(database, 'games');
  const newGameRef = push(gamesRef);
  const gameId = newGameRef.key!;

  const secretNumber = generateNumber(6);
  const systemDigit = Math.floor(Math.random() * 10);

  // Firebase ignores null values and empty objects, so only write defined fields.
  // Null fields (coinFlip picks, firstTurn, result) will be absent initially.
  const roomData: Record<string, any> = {
    status: 'coin_flip',
    secretNumber,
    assistedMode,
    player1: { id: player1Id, lastSeen: Date.now() },
    player2: { id: player2Id, lastSeen: Date.now() },
    coinFlip: {
      systemDigit,
    },
    turns: {
      currentTurn: 'player1',
      turnNumber: 1,
      turnStartedAt: 0,
    },
    ...(leagueId ? { leagueId } : {}),
  };

  await set(newGameRef, roomData);
  console.log('[Matchmaking] Room created with data:', JSON.stringify(roomData));
  return gameId;
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
 * Clean up stale matchmaking entries older than 60 seconds.
 */
export async function cleanStaleEntries(): Promise<void> {
  const queueRef = ref(database, 'matchmaking');
  const snapshot = await get(queueRef);

  if (!snapshot.exists()) return;

  const entries = snapshot.val() as Record<string, MatchmakingEntry>;
  const now = Date.now();

  for (const [key, entry] of Object.entries(entries)) {
    if (now - entry.timestamp > 60000) {
      await remove(ref(database, `matchmaking/${key}`));
    }
  }
}

/**
 * Clear player notification after reading it.
 */
export async function clearNotification(playerId: string): Promise<void> {
  await remove(ref(database, `playerNotifications/${playerId}`));
}

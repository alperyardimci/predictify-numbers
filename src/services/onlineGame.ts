import { ref, onValue, off } from 'firebase/database';
import { database } from './firebase';
import { OnlineGameRoom } from '../types/online';
import {
  coinFlipPickFn,
  submitGuessFn,
  heartbeatFn,
  claimDisconnectWinFn,
  skipTurnFn,
  forfeitFn,
} from './cloudFunctions';
import { DigitStatus } from '../utils/gameLogic';

/**
 * Listen to the game room for real-time updates.
 */
export function listenToGame(
  gameId: string,
  onUpdate: (room: OnlineGameRoom) => void
): () => void {
  const gameRef = ref(database, `games/${gameId}`);
  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      onUpdate(data as OnlineGameRoom);
    }
  });
  return () => off(gameRef);
}

/**
 * Submit a coin flip pick via Cloud Function.
 */
export async function submitCoinFlipPick(
  gameId: string,
  pick: number
): Promise<void> {
  await coinFlipPickFn({ gameId, pick });
}

/**
 * Submit a guess via Cloud Function. Returns the result from the server.
 */
export async function submitGuess(
  gameId: string,
  guessValue: string
): Promise<{ bulls: number; cows: number; repeats: number; digitStatuses: DigitStatus[] | null }> {
  const result = await submitGuessFn({ gameId, guess: guessValue });
  return result.data;
}

/**
 * Update the lastSeen timestamp for heartbeat via Cloud Function.
 */
export async function updateHeartbeat(gameId: string): Promise<void> {
  await heartbeatFn({ gameId });
}

/**
 * Claim victory due to opponent disconnect via Cloud Function.
 */
export async function claimDisconnectWin(gameId: string): Promise<void> {
  await claimDisconnectWinFn({ gameId });
}

/**
 * Skip the current player's turn via Cloud Function.
 */
export async function skipTurn(gameId: string): Promise<void> {
  await skipTurnFn({ gameId });
}

/**
 * Forfeit the game via Cloud Function.
 */
export async function forfeitGame(gameId: string): Promise<void> {
  await forfeitFn({ gameId });
}

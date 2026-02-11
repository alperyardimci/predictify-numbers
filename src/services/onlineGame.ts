import {
  ref,
  set,
  update,
  get,
  onValue,
  off,
  runTransaction,
} from 'firebase/database';
import { database } from './firebase';
import { OnlineGameRoom, PlayerSlot } from '../types/online';
import { checkGuess } from '../utils/gameLogic';
import { computeFirstTurn } from '../utils/coinFlip';

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
 * Submit a coin flip pick for the given player.
 * Uses a transaction to atomically resolve the coin flip when both picks are in,
 * preventing the race where both clients compute different firstTurn values.
 */
export async function submitCoinFlipPick(
  gameId: string,
  mySlot: PlayerSlot,
  pick: number
): Promise<void> {
  const gameRef = ref(database, `games/${gameId}`);

  await runTransaction(gameRef, (game: any) => {
    if (!game) return game;
    if (game.status !== 'coin_flip') return;

    // Write our pick
    const pickField = mySlot === 'player1' ? 'player1Pick' : 'player2Pick';
    game.coinFlip[pickField] = pick;

    // If both players have picked, resolve the coin flip in the same transaction
    const cf = game.coinFlip;
    if (cf.player1Pick != null && cf.player2Pick != null && cf.firstTurn == null) {
      const firstTurn = computeFirstTurn(cf.systemDigit, cf.player1Pick, cf.player2Pick);
      game.coinFlip.firstTurn = firstTurn;
      game.status = 'playing';
      game.turns.currentTurn = firstTurn;
      game.turns.turnNumber = 1;
      game.turns.turnStartedAt = Date.now();
    }

    return game;
  });
}

/**
 * Submit a guess for the current player.
 */
export async function submitGuess(
  gameId: string,
  mySlot: PlayerSlot,
  guessValue: string
): Promise<void> {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);
  const room = snapshot.val() as OnlineGameRoom;

  if (!room || room.status !== 'playing') return;
  if (room.turns.currentTurn !== mySlot) return;

  // Calculate bulls, cows, repeats
  const result = checkGuess(room.secretNumber, guessValue);

  // Count existing guesses for this player
  const myGuesses = room.guesses?.[mySlot] || {};
  const guessIndex = Object.keys(myGuesses).length;

  const guessData = {
    value: guessValue,
    bulls: result.bulls,
    cows: result.cows,
    repeats: result.repeats,
    index: guessIndex,
  };

  // Write the guess
  await set(
    ref(database, `games/${gameId}/guesses/${mySlot}/${guessIndex}`),
    guessData
  );

  // Check for win (all 6 bulls)
  if (result.bulls === 6) {
    await update(ref(database, `games/${gameId}`), {
      status: 'finished',
      'result/winner': mySlot,
      'result/reason': 'guessed',
      'result/winnerGuessCount': guessIndex + 1,
    });
    return;
  }

  // Flip the turn
  const otherSlot: PlayerSlot = mySlot === 'player1' ? 'player2' : 'player1';
  await update(ref(database, `games/${gameId}/turns`), {
    currentTurn: otherSlot,
    turnNumber: room.turns.turnNumber + 1,
    turnStartedAt: Date.now(),
  });
}

/**
 * Update the lastSeen timestamp for heartbeat.
 */
export async function updateHeartbeat(
  gameId: string,
  mySlot: PlayerSlot
): Promise<void> {
  await update(ref(database, `games/${gameId}/${mySlot}`), {
    lastSeen: Date.now(),
  });
}

/**
 * Claim victory due to opponent disconnect.
 */
export async function claimDisconnectWin(
  gameId: string,
  mySlot: PlayerSlot
): Promise<void> {
  const gameRef = ref(database, `games/${gameId}`);
  await runTransaction(gameRef, (room: OnlineGameRoom | null) => {
    if (!room) return room;
    if (room.status === 'finished') return room; // Already finished
    room.status = 'finished';
    room.result = {
      winner: mySlot,
      reason: 'disconnect',
      winnerGuessCount: null,
    };
    return room;
  });
}

/**
 * Skip the current player's turn (called when 30s timer expires).
 */
export async function skipTurn(
  gameId: string,
  currentSlot: PlayerSlot
): Promise<void> {
  const gameRef = ref(database, `games/${gameId}`);
  await runTransaction(gameRef, (room: OnlineGameRoom | null) => {
    if (!room) return room;
    if (room.status !== 'playing') return room;
    if (room.turns.currentTurn !== currentSlot) return room;

    const otherSlot: PlayerSlot = currentSlot === 'player1' ? 'player2' : 'player1';
    room.turns.currentTurn = otherSlot;
    room.turns.turnNumber = room.turns.turnNumber + 1;
    room.turns.turnStartedAt = Date.now();
    return room;
  });
}

/**
 * Forfeit the game (player quits voluntarily).
 */
export async function forfeitGame(
  gameId: string,
  loserSlot: PlayerSlot
): Promise<void> {
  const gameRef = ref(database, `games/${gameId}`);
  const winnerSlot: PlayerSlot = loserSlot === 'player1' ? 'player2' : 'player1';
  await runTransaction(gameRef, (room: OnlineGameRoom | null) => {
    if (!room) return room;
    if (room.status === 'finished') return room;
    room.status = 'finished';
    room.result = {
      winner: winnerSlot,
      reason: 'forfeit',
      winnerGuessCount: null,
    };
    return room;
  });
}

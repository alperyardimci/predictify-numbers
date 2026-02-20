import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDatabase } from 'firebase-admin/database';
import { checkGuess, getDigitStatuses } from './utils/gameLogic';
import { computeFirstTurn } from './utils/coinFlip';

const REGION = 'europe-west1';

function getSlotForUser(game: any, uid: string): 'player1' | 'player2' {
  if (game.player1?.id === uid) return 'player1';
  if (game.player2?.id === uid) return 'player2';
  throw new HttpsError('permission-denied', 'Bu oyunun oyuncusu değilsin.');
}

export const coinFlipPick = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Giriş yapmalısın.');

  const { gameId, pick } = request.data;
  if (!gameId || typeof pick !== 'number' || pick < 0 || pick > 9) {
    throw new HttpsError('invalid-argument', 'Geçersiz parametre.');
  }

  const db = getDatabase();
  const gameRef = db.ref(`games/${gameId}`);

  const result = await gameRef.transaction((game: any) => {
    if (!game) return game;
    if (game.status !== 'coin_flip') return;

    const slot = game.player1?.id === uid ? 'player1' : game.player2?.id === uid ? 'player2' : null;
    if (!slot) return;

    const pickField = slot === 'player1' ? 'player1Pick' : 'player2Pick';
    game.coinFlip[pickField] = pick;

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

  if (!result.committed) {
    throw new HttpsError('failed-precondition', 'İşlem başarısız.');
  }

  return { success: true };
});

export const submitGuess = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Giriş yapmalısın.');

  const { gameId, guess } = request.data;
  if (!gameId || !guess || !/^\d{6}$/.test(guess)) {
    throw new HttpsError('invalid-argument', 'Geçersiz tahmin.');
  }

  const db = getDatabase();

  // Read game and secret
  const [gameSnap, secretSnap] = await Promise.all([
    db.ref(`games/${gameId}`).get(),
    db.ref(`gameSecrets/${gameId}`).get(),
  ]);

  const room = gameSnap.val();
  if (!room) throw new HttpsError('not-found', 'Oyun bulunamadı.');
  if (room.status !== 'playing') throw new HttpsError('failed-precondition', 'Oyun aktif değil.');

  const mySlot = getSlotForUser(room, uid);
  if (room.turns.currentTurn !== mySlot) {
    throw new HttpsError('failed-precondition', 'Senin sıran değil.');
  }

  const secret = secretSnap.val();
  if (!secret) throw new HttpsError('internal', 'Gizli sayı bulunamadı.');

  // Calculate result
  const result = checkGuess(secret, guess);
  const digitStatuses = room.assistedMode ? getDigitStatuses(secret, guess) : null;

  // Count existing guesses
  const myGuesses = room.guesses?.[mySlot] || {};
  const guessIndex = Object.keys(myGuesses).length;

  const guessData: any = {
    value: guess,
    bulls: result.bulls,
    cows: result.cows,
    repeats: result.repeats,
    index: guessIndex,
  };
  if (digitStatuses) {
    guessData.digitStatuses = digitStatuses;
  }

  // Write the guess
  await db.ref(`games/${gameId}/guesses/${mySlot}/${guessIndex}`).set(guessData);

  // Check for win
  if (result.bulls === 6) {
    await db.ref(`games/${gameId}`).update({
      status: 'finished',
      secretNumber: secret,
      'result/winner': mySlot,
      'result/reason': 'guessed',
      'result/winnerGuessCount': guessIndex + 1,
    });
    return { ...result, digitStatuses };
  }

  // Flip the turn
  const otherSlot = mySlot === 'player1' ? 'player2' : 'player1';
  await db.ref(`games/${gameId}/turns`).update({
    currentTurn: otherSlot,
    turnNumber: room.turns.turnNumber + 1,
    turnStartedAt: Date.now(),
  });

  return { ...result, digitStatuses };
});

export const heartbeat = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Giriş yapmalısın.');

  const { gameId } = request.data;
  if (!gameId) throw new HttpsError('invalid-argument', 'gameId gerekli.');

  const db = getDatabase();
  const gameSnap = await db.ref(`games/${gameId}`).get();
  const room = gameSnap.val();
  if (!room) throw new HttpsError('not-found', 'Oyun bulunamadı.');

  const mySlot = getSlotForUser(room, uid);
  await db.ref(`games/${gameId}/${mySlot}/lastSeen`).set(Date.now());

  return { success: true };
});

export const claimDisconnectWin = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Giriş yapmalısın.');

  const { gameId } = request.data;
  if (!gameId) throw new HttpsError('invalid-argument', 'gameId gerekli.');

  const db = getDatabase();
  const gameRef = db.ref(`games/${gameId}`);

  const result = await gameRef.transaction((room: any) => {
    if (!room) return room;
    if (room.status === 'finished') return room;

    const mySlot = room.player1?.id === uid ? 'player1' : room.player2?.id === uid ? 'player2' : null;
    if (!mySlot) return;

    const opponentSlot = mySlot === 'player1' ? 'player2' : 'player1';
    const opponentLastSeen = room[opponentSlot]?.lastSeen || 0;
    const elapsed = Date.now() - opponentLastSeen;

    if (elapsed < 30000) return; // Opponent still connected

    room.status = 'finished';
    room.result = {
      winner: mySlot,
      reason: 'disconnect',
      winnerGuessCount: null,
    };
    // Copy secret for post-game display
    return room;
  });

  // Copy secret after disconnect win
  if (result.committed) {
    const snap = await db.ref(`games/${gameId}`).get();
    const game = snap.val();
    if (game?.status === 'finished' && !game.secretNumber) {
      const secretSnap = await db.ref(`gameSecrets/${gameId}`).get();
      const secret = secretSnap.val();
      if (secret) {
        await db.ref(`games/${gameId}/secretNumber`).set(secret);
      }
    }
  }

  return { success: true };
});

export const skipTurn = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Giriş yapmalısın.');

  const { gameId } = request.data;
  if (!gameId) throw new HttpsError('invalid-argument', 'gameId gerekli.');

  const db = getDatabase();
  const gameRef = db.ref(`games/${gameId}`);

  await gameRef.transaction((room: any) => {
    if (!room) return room;
    if (room.status !== 'playing') return room;

    const mySlot = room.player1?.id === uid ? 'player1' : room.player2?.id === uid ? 'player2' : null;
    if (!mySlot) return;
    if (room.turns.currentTurn !== mySlot) return;

    // Verify turn has expired (30s server-side check)
    const elapsed = Date.now() - (room.turns.turnStartedAt || 0);
    if (elapsed < 28000) return; // 2s grace period

    const otherSlot = mySlot === 'player1' ? 'player2' : 'player1';
    room.turns.currentTurn = otherSlot;
    room.turns.turnNumber = room.turns.turnNumber + 1;
    room.turns.turnStartedAt = Date.now();
    return room;
  });

  return { success: true };
});

export const forfeit = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Giriş yapmalısın.');

  const { gameId } = request.data;
  if (!gameId) throw new HttpsError('invalid-argument', 'gameId gerekli.');

  const db = getDatabase();
  const gameRef = db.ref(`games/${gameId}`);

  const txResult = await gameRef.transaction((room: any) => {
    if (!room) return room;
    if (room.status === 'finished') return room;

    const mySlot = room.player1?.id === uid ? 'player1' : room.player2?.id === uid ? 'player2' : null;
    if (!mySlot) return;

    const winnerSlot = mySlot === 'player1' ? 'player2' : 'player1';
    room.status = 'finished';
    room.result = {
      winner: winnerSlot,
      reason: 'forfeit',
      winnerGuessCount: null,
    };
    return room;
  });

  // Copy secret after forfeit
  if (txResult.committed) {
    const snap = await db.ref(`games/${gameId}`).get();
    const game = snap.val();
    if (game?.status === 'finished' && !game.secretNumber) {
      const secretSnap = await db.ref(`gameSecrets/${gameId}`).get();
      const secret = secretSnap.val();
      if (secret) {
        await db.ref(`games/${gameId}/secretNumber`).set(secret);
      }
    }
  }

  return { success: true };
});

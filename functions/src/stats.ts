import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDatabase } from 'firebase-admin/database';

const REGION = 'europe-west1';

export const updateLeagueStats = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Giriş yapmalısın.');

  const { gameId } = request.data;
  if (!gameId) throw new HttpsError('invalid-argument', 'gameId gerekli.');

  const db = getDatabase();

  // Read game data
  const gameSnap = await db.ref(`games/${gameId}`).get();
  const game = gameSnap.val();
  if (!game) throw new HttpsError('not-found', 'Oyun bulunamadı.');
  if (game.status !== 'finished') throw new HttpsError('failed-precondition', 'Oyun henüz bitmedi.');
  if (!game.leagueId) throw new HttpsError('failed-precondition', 'Bu bir lig maçı değil.');
  if (!game.result?.winner) throw new HttpsError('failed-precondition', 'Kazanan belirlenemedi.');

  // Verify caller is a player in this game
  if (game.player1?.id !== uid && game.player2?.id !== uid) {
    throw new HttpsError('permission-denied', 'Bu oyunun oyuncusu değilsin.');
  }

  const leagueId = game.leagueId;
  const winnerSlot = game.result.winner;
  const loserSlot = winnerSlot === 'player1' ? 'player2' : 'player1';
  const winnerId = game[winnerSlot].id;
  const loserId = game[loserSlot].id;
  const reason = game.result.reason || 'guessed';
  const winnerGuessCount = game.result.winnerGuessCount || 0;

  // Atomically check & set leagueStatsUpdated flag
  const flagRef = db.ref(`games/${gameId}/leagueStatsUpdated`);
  const flagResult = await flagRef.transaction((current: boolean | null) => {
    if (current === true) return; // abort
    return true;
  });

  if (!flagResult.committed) return { success: true, alreadyUpdated: true };

  const now = Date.now();

  // Read display names
  const [winnerSnap, loserSnap] = await Promise.all([
    db.ref(`leagueMembers/${leagueId}/${winnerId}/displayName`).get(),
    db.ref(`leagueMembers/${leagueId}/${loserId}/displayName`).get(),
  ]);
  const winnerName = winnerSnap.exists() ? winnerSnap.val() : '?';
  const loserName = loserSnap.exists() ? loserSnap.val() : '?';

  // Update winner stats
  await db.ref(`leagueMembers/${leagueId}/${winnerId}`).transaction((member: any) => {
    if (!member) return member;
    member.wins = (member.wins || 0) + 1;
    if (reason === 'guessed') {
      member.totalGuessesInWins = (member.totalGuessesInWins || 0) + winnerGuessCount;
    }
    member.lastMatchAt = now;
    return member;
  });

  // Update loser stats
  await db.ref(`leagueMembers/${leagueId}/${loserId}`).transaction((member: any) => {
    if (!member) return member;
    member.losses = (member.losses || 0) + 1;
    member.lastMatchAt = now;
    return member;
  });

  // Write match record
  const matchRef = db.ref(`leagueMatches/${leagueId}`).push();
  await matchRef.set({
    winnerId,
    loserId,
    winnerName,
    loserName,
    reason,
    winnerGuessCount: winnerGuessCount || 0,
    timestamp: now,
  });

  return { success: true };
});

export const clearNotification = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Giriş yapmalısın.');

  const db = getDatabase();
  await db.ref(`playerNotifications/${uid}`).remove();

  return { success: true };
});

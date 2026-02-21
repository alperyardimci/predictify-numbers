"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearNotification = exports.updateLeagueStats = void 0;
const https_1 = require("firebase-functions/v2/https");
const database_1 = require("firebase-admin/database");
const REGION = 'europe-west1';
exports.updateLeagueStats = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { gameId } = request.data;
    if (!gameId)
        throw new https_1.HttpsError('invalid-argument', 'gameId gerekli.');
    const db = (0, database_1.getDatabase)();
    // Read game data
    const gameSnap = await db.ref(`games/${gameId}`).get();
    const game = gameSnap.val();
    if (!game)
        throw new https_1.HttpsError('not-found', 'Oyun bulunamadı.');
    if (game.status !== 'finished')
        throw new https_1.HttpsError('failed-precondition', 'Oyun henüz bitmedi.');
    if (!game.leagueId)
        throw new https_1.HttpsError('failed-precondition', 'Bu bir lig maçı değil.');
    if (!game.result?.winner)
        throw new https_1.HttpsError('failed-precondition', 'Kazanan belirlenemedi.');
    // Verify caller is a player in this game
    if (game.player1?.id !== uid && game.player2?.id !== uid) {
        throw new https_1.HttpsError('permission-denied', 'Bu oyunun oyuncusu değilsin.');
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
    const flagResult = await flagRef.transaction((current) => {
        if (current === true)
            return; // abort
        return true;
    });
    if (!flagResult.committed)
        return { success: true, alreadyUpdated: true };
    const now = Date.now();
    // Read display names
    const [winnerSnap, loserSnap] = await Promise.all([
        db.ref(`leagueMembers/${leagueId}/${winnerId}/displayName`).get(),
        db.ref(`leagueMembers/${leagueId}/${loserId}/displayName`).get(),
    ]);
    const winnerName = winnerSnap.exists() ? winnerSnap.val() : '?';
    const loserName = loserSnap.exists() ? loserSnap.val() : '?';
    // Update winner stats
    await db.ref(`leagueMembers/${leagueId}/${winnerId}`).transaction((member) => {
        if (!member)
            return member;
        member.wins = (member.wins || 0) + 1;
        if (reason === 'guessed') {
            member.totalGuessesInWins = (member.totalGuessesInWins || 0) + winnerGuessCount;
        }
        member.lastMatchAt = now;
        return member;
    });
    // Update loser stats
    await db.ref(`leagueMembers/${leagueId}/${loserId}`).transaction((member) => {
        if (!member)
            return member;
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
exports.clearNotification = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const db = (0, database_1.getDatabase)();
    await db.ref(`playerNotifications/${uid}`).remove();
    return { success: true };
});
//# sourceMappingURL=stats.js.map
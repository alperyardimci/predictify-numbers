"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryMatch = exports.leaveQueue = exports.joinQueue = void 0;
const https_1 = require("firebase-functions/v2/https");
const database_1 = require("firebase-admin/database");
const gameLogic_1 = require("./utils/gameLogic");
const REGION = 'europe-west1';
exports.joinQueue = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { assistedMode, leagueId } = request.data;
    const db = (0, database_1.getDatabase)();
    const queueRef = db.ref('matchmaking');
    const newEntryRef = queueRef.push();
    await newEntryRef.set({
        playerId: uid,
        timestamp: Date.now(),
        assistedMode: !!assistedMode,
        leagueId: leagueId || null,
    });
    return { entryKey: newEntryRef.key };
});
exports.leaveQueue = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { entryKey } = request.data;
    if (!entryKey)
        throw new https_1.HttpsError('invalid-argument', 'entryKey gerekli.');
    const db = (0, database_1.getDatabase)();
    const entrySnap = await db.ref(`matchmaking/${entryKey}`).get();
    const entry = entrySnap.val();
    // Only allow removing own entry
    if (entry && entry.playerId !== uid) {
        throw new https_1.HttpsError('permission-denied', 'Bu giriş sana ait değil.');
    }
    await db.ref(`matchmaking/${entryKey}`).remove();
    return { success: true };
});
exports.tryMatch = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { entryKey, assistedMode, leagueId } = request.data;
    if (!entryKey)
        throw new https_1.HttpsError('invalid-argument', 'entryKey gerekli.');
    const db = (0, database_1.getDatabase)();
    const queueRef = db.ref('matchmaking');
    let claimedOpponentId = null;
    const txResult = await queueRef.transaction((queue) => {
        if (!queue)
            return queue;
        // Verify our entry still exists
        if (!queue[entryKey] || queue[entryKey].playerId !== uid) {
            return; // abort
        }
        // Find opponent
        const now = Date.now();
        let foundKey = null;
        let foundId = null;
        for (const [key, entry] of Object.entries(queue)) {
            if (key === entryKey)
                continue;
            if (entry.playerId === uid)
                continue;
            if (now - entry.timestamp > 60000)
                continue;
            if (!!entry.assistedMode !== !!assistedMode)
                continue;
            if ((entry.leagueId || null) !== (leagueId || null))
                continue;
            foundKey = key;
            foundId = entry.playerId;
            break;
        }
        if (!foundKey || !foundId)
            return; // abort
        claimedOpponentId = foundId;
        delete queue[entryKey];
        delete queue[foundKey];
        return queue;
    });
    if (!txResult.committed || !claimedOpponentId) {
        return { matched: false };
    }
    const opponentId = claimedOpponentId;
    // Generate secret and game data
    const secretNumber = (0, gameLogic_1.generateNumber)(6);
    const systemDigit = Math.floor(Math.random() * 10);
    // Create game room (without secretNumber)
    const gamesRef = db.ref('games');
    const newGameRef = gamesRef.push();
    const gameId = newGameRef.key;
    const roomData = {
        status: 'coin_flip',
        assistedMode: !!assistedMode,
        player1: { id: uid, lastSeen: Date.now() },
        player2: { id: opponentId, lastSeen: Date.now() },
        coinFlip: { systemDigit },
        turns: { currentTurn: 'player1', turnNumber: 1, turnStartedAt: 0 },
    };
    if (leagueId) {
        roomData.leagueId = leagueId;
    }
    // Write game room + secret separately + notify opponent
    await Promise.all([
        newGameRef.set(roomData),
        db.ref(`gameSecrets/${gameId}`).set(secretNumber),
        db.ref(`playerNotifications/${opponentId}`).set({
            gameId,
            slot: 'player2',
        }),
    ]);
    return { matched: true, gameId, slot: 'player1' };
});
//# sourceMappingURL=matchmaking.js.map
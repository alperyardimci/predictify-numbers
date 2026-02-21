"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelChallenge = exports.declineChallenge = exports.acceptChallenge = exports.sendChallenge = exports.leaveLeague = exports.joinLeague = exports.createLeague = void 0;
const https_1 = require("firebase-functions/v2/https");
const database_1 = require("firebase-admin/database");
const gameLogic_1 = require("./utils/gameLogic");
const REGION = 'europe-west1';
const MAX_LEAGUES = 5;
// Character set excluding confusable chars (0/O, 1/I/L)
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateLeagueCode() {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
}
exports.createLeague = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { name, assistedMode, displayName } = request.data;
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 30) {
        throw new https_1.HttpsError('invalid-argument', 'Geçersiz lig adı.');
    }
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0 || displayName.length > 20) {
        throw new https_1.HttpsError('invalid-argument', 'Geçersiz takma ad.');
    }
    const db = (0, database_1.getDatabase)();
    // Check league limit
    const indexSnap = await db.ref(`playerLeagues/${uid}`).get();
    const count = indexSnap.exists() ? Object.keys(indexSnap.val()).length : 0;
    if (count >= MAX_LEAGUES) {
        throw new https_1.HttpsError('resource-exhausted', `En fazla ${MAX_LEAGUES} ligde yer alabilirsin.`);
    }
    // Generate unique code
    let code = '';
    let attempts = 0;
    do {
        code = generateLeagueCode();
        const existing = await db.ref(`leagueCodes/${code}`).get();
        if (!existing.exists())
            break;
        attempts++;
    } while (attempts < 10);
    if (attempts >= 10) {
        throw new https_1.HttpsError('internal', 'Kod oluşturulamadı, tekrar deneyin.');
    }
    const leagueRef = db.ref('leagues').push();
    const leagueId = leagueRef.key;
    const now = Date.now();
    const league = {
        name: name.trim(),
        code,
        createdBy: uid,
        createdAt: now,
        assistedMode: !!assistedMode,
        memberCount: 1,
    };
    const member = {
        displayName: displayName.trim(),
        joinedAt: now,
        wins: 0,
        losses: 0,
        totalGuessesInWins: 0,
        lastMatchAt: 0,
    };
    await Promise.all([
        leagueRef.set(league),
        db.ref(`leagueMembers/${leagueId}/${uid}`).set(member),
        db.ref(`playerLeagues/${uid}/${leagueId}`).set(true),
        db.ref(`leagueCodes/${code}`).set(leagueId),
    ]);
    return { id: leagueId, ...league };
});
exports.joinLeague = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { code, displayName } = request.data;
    if (!code || typeof code !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Geçersiz lig kodu.');
    }
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0 || displayName.length > 20) {
        throw new https_1.HttpsError('invalid-argument', 'Geçersiz takma ad.');
    }
    const db = (0, database_1.getDatabase)();
    const upperCode = code.toUpperCase();
    // Check league limit
    const indexSnap = await db.ref(`playerLeagues/${uid}`).get();
    const count = indexSnap.exists() ? Object.keys(indexSnap.val()).length : 0;
    if (count >= MAX_LEAGUES) {
        throw new https_1.HttpsError('resource-exhausted', `En fazla ${MAX_LEAGUES} ligde yer alabilirsin.`);
    }
    // Lookup league
    const codeSnap = await db.ref(`leagueCodes/${upperCode}`).get();
    if (!codeSnap.exists()) {
        throw new https_1.HttpsError('not-found', 'Geçersiz lig kodu.');
    }
    const leagueId = codeSnap.val();
    // Check already member
    const memberSnap = await db.ref(`leagueMembers/${leagueId}/${uid}`).get();
    if (memberSnap.exists()) {
        throw new https_1.HttpsError('already-exists', 'Bu lige zaten katıldın.');
    }
    const leagueSnap = await db.ref(`leagues/${leagueId}`).get();
    if (!leagueSnap.exists()) {
        throw new https_1.HttpsError('not-found', 'Lig bulunamadı.');
    }
    const leagueData = leagueSnap.val();
    const now = Date.now();
    const member = {
        displayName: displayName.trim(),
        joinedAt: now,
        wins: 0,
        losses: 0,
        totalGuessesInWins: 0,
        lastMatchAt: 0,
    };
    await Promise.all([
        db.ref(`leagueMembers/${leagueId}/${uid}`).set(member),
        db.ref(`playerLeagues/${uid}/${leagueId}`).set(true),
    ]);
    await db.ref(`leagues/${leagueId}/memberCount`).transaction((current) => {
        return (current || 0) + 1;
    });
    return { id: leagueId, ...leagueData };
});
exports.leaveLeague = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { leagueId } = request.data;
    if (!leagueId)
        throw new https_1.HttpsError('invalid-argument', 'leagueId gerekli.');
    const db = (0, database_1.getDatabase)();
    // Verify membership
    const memberSnap = await db.ref(`leagueMembers/${leagueId}/${uid}`).get();
    if (!memberSnap.exists()) {
        throw new https_1.HttpsError('not-found', 'Bu ligin üyesi değilsin.');
    }
    await Promise.all([
        db.ref(`leagueMembers/${leagueId}/${uid}`).remove(),
        db.ref(`playerLeagues/${uid}/${leagueId}`).remove(),
    ]);
    await db.ref(`leagues/${leagueId}/memberCount`).transaction((current) => {
        return Math.max(0, (current || 1) - 1);
    });
    return { success: true };
});
exports.sendChallenge = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { targetId, leagueId } = request.data;
    if (!targetId || !leagueId) {
        throw new https_1.HttpsError('invalid-argument', 'targetId ve leagueId gerekli.');
    }
    const db = (0, database_1.getDatabase)();
    // Verify both are league members + get display names
    const [fromMemberSnap, toMemberSnap, leagueSnap] = await Promise.all([
        db.ref(`leagueMembers/${leagueId}/${uid}`).get(),
        db.ref(`leagueMembers/${leagueId}/${targetId}`).get(),
        db.ref(`leagues/${leagueId}`).get(),
    ]);
    if (!fromMemberSnap.exists() || !toMemberSnap.exists()) {
        throw new https_1.HttpsError('permission-denied', 'Her iki oyuncu da lig üyesi olmalı.');
    }
    if (!leagueSnap.exists()) {
        throw new https_1.HttpsError('not-found', 'Lig bulunamadı.');
    }
    const fromName = fromMemberSnap.val().displayName || '?';
    const assistedMode = leagueSnap.val().assistedMode;
    const challengeRef = db.ref('challenges').push();
    const challengeId = challengeRef.key;
    const challenge = {
        fromId: uid,
        toId: targetId,
        fromName,
        leagueId,
        assistedMode,
        status: 'pending',
        gameId: null,
        timestamp: Date.now(),
    };
    await Promise.all([
        challengeRef.set(challenge),
        db.ref(`playerChallenges/${targetId}/${challengeId}`).set(true),
    ]);
    return { challengeId };
});
exports.acceptChallenge = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { challengeId } = request.data;
    if (!challengeId)
        throw new https_1.HttpsError('invalid-argument', 'challengeId gerekli.');
    const db = (0, database_1.getDatabase)();
    const snap = await db.ref(`challenges/${challengeId}`).get();
    if (!snap.exists())
        throw new https_1.HttpsError('not-found', 'Teklif bulunamadı.');
    const challenge = snap.val();
    if (challenge.toId !== uid) {
        throw new https_1.HttpsError('permission-denied', 'Bu teklif sana yönelik değil.');
    }
    if (challenge.status !== 'pending') {
        throw new https_1.HttpsError('failed-precondition', 'Teklif artık geçerli değil.');
    }
    // Create game room
    const secretNumber = (0, gameLogic_1.generateNumber)(6);
    const systemDigit = Math.floor(Math.random() * 10);
    const newGameRef = db.ref('games').push();
    const gameId = newGameRef.key;
    const roomData = {
        status: 'coin_flip',
        assistedMode: challenge.assistedMode,
        player1: { id: challenge.fromId, lastSeen: Date.now() },
        player2: { id: uid, lastSeen: Date.now() },
        coinFlip: { systemDigit },
        turns: { currentTurn: 'player1', turnNumber: 1, turnStartedAt: 0 },
        leagueId: challenge.leagueId,
    };
    await Promise.all([
        newGameRef.set(roomData),
        db.ref(`gameSecrets/${gameId}`).set(secretNumber),
        db.ref(`challenges/${challengeId}`).update({ status: 'accepted', gameId }),
        db.ref(`playerChallenges/${uid}/${challengeId}`).remove(),
    ]);
    return { gameId, mySlot: 'player2' };
});
exports.declineChallenge = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { challengeId } = request.data;
    if (!challengeId)
        throw new https_1.HttpsError('invalid-argument', 'challengeId gerekli.');
    const db = (0, database_1.getDatabase)();
    const snap = await db.ref(`challenges/${challengeId}`).get();
    if (!snap.exists())
        return { success: true };
    const challenge = snap.val();
    if (challenge.toId !== uid) {
        throw new https_1.HttpsError('permission-denied', 'Bu teklif sana yönelik değil.');
    }
    await Promise.all([
        db.ref(`challenges/${challengeId}`).update({ status: 'declined' }),
        db.ref(`playerChallenges/${uid}/${challengeId}`).remove(),
    ]);
    return { success: true };
});
exports.cancelChallenge = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { challengeId } = request.data;
    if (!challengeId)
        throw new https_1.HttpsError('invalid-argument', 'challengeId gerekli.');
    const db = (0, database_1.getDatabase)();
    const snap = await db.ref(`challenges/${challengeId}`).get();
    if (!snap.exists())
        return { success: true };
    const challenge = snap.val();
    if (challenge.fromId !== uid) {
        throw new https_1.HttpsError('permission-denied', 'Bu teklif sana ait değil.');
    }
    await Promise.all([
        db.ref(`challenges/${challengeId}`).update({ status: 'expired' }),
        db.ref(`playerChallenges/${challenge.toId}/${challengeId}`).remove(),
    ]);
    return { success: true };
});
//# sourceMappingURL=league.js.map
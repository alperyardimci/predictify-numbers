"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forfeit = exports.skipTurn = exports.claimDisconnectWin = exports.heartbeat = exports.submitGuess = exports.coinFlipPick = void 0;
const https_1 = require("firebase-functions/v2/https");
const database_1 = require("firebase-admin/database");
const gameLogic_1 = require("./utils/gameLogic");
const coinFlip_1 = require("./utils/coinFlip");
const REGION = 'europe-west1';
function getSlotForUser(game, uid) {
    if (game.player1?.id === uid)
        return 'player1';
    if (game.player2?.id === uid)
        return 'player2';
    throw new https_1.HttpsError('permission-denied', 'Bu oyunun oyuncusu değilsin.');
}
exports.coinFlipPick = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { gameId, pick } = request.data;
    if (!gameId || typeof pick !== 'number' || pick < 0 || pick > 9) {
        throw new https_1.HttpsError('invalid-argument', 'Geçersiz parametre.');
    }
    const db = (0, database_1.getDatabase)();
    const gameRef = db.ref(`games/${gameId}`);
    const result = await gameRef.transaction((game) => {
        if (!game)
            return game;
        if (game.status !== 'coin_flip')
            return;
        const slot = game.player1?.id === uid ? 'player1' : game.player2?.id === uid ? 'player2' : null;
        if (!slot)
            return;
        const pickField = slot === 'player1' ? 'player1Pick' : 'player2Pick';
        game.coinFlip[pickField] = pick;
        const cf = game.coinFlip;
        if (cf.player1Pick != null && cf.player2Pick != null && cf.firstTurn == null) {
            const firstTurn = (0, coinFlip_1.computeFirstTurn)(cf.systemDigit, cf.player1Pick, cf.player2Pick);
            game.coinFlip.firstTurn = firstTurn;
            game.status = 'playing';
            game.turns.currentTurn = firstTurn;
            game.turns.turnNumber = 1;
            game.turns.turnStartedAt = Date.now();
        }
        return game;
    });
    if (!result.committed) {
        throw new https_1.HttpsError('failed-precondition', 'İşlem başarısız.');
    }
    return { success: true };
});
exports.submitGuess = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { gameId, guess } = request.data;
    if (!gameId || !guess || !/^\d{6}$/.test(guess)) {
        throw new https_1.HttpsError('invalid-argument', 'Geçersiz tahmin.');
    }
    const db = (0, database_1.getDatabase)();
    // Read game and secret
    const [gameSnap, secretSnap] = await Promise.all([
        db.ref(`games/${gameId}`).get(),
        db.ref(`gameSecrets/${gameId}`).get(),
    ]);
    const room = gameSnap.val();
    if (!room)
        throw new https_1.HttpsError('not-found', 'Oyun bulunamadı.');
    if (room.status !== 'playing')
        throw new https_1.HttpsError('failed-precondition', 'Oyun aktif değil.');
    const mySlot = getSlotForUser(room, uid);
    if (room.turns.currentTurn !== mySlot) {
        throw new https_1.HttpsError('failed-precondition', 'Senin sıran değil.');
    }
    const secret = secretSnap.val();
    if (!secret)
        throw new https_1.HttpsError('internal', 'Gizli sayı bulunamadı.');
    // Calculate result
    const result = (0, gameLogic_1.checkGuess)(secret, guess);
    const digitStatuses = room.assistedMode ? (0, gameLogic_1.getDigitStatuses)(secret, guess) : null;
    // Count existing guesses
    const myGuesses = room.guesses?.[mySlot] || {};
    const guessIndex = Object.keys(myGuesses).length;
    const guessData = {
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
exports.heartbeat = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { gameId } = request.data;
    if (!gameId)
        throw new https_1.HttpsError('invalid-argument', 'gameId gerekli.');
    const db = (0, database_1.getDatabase)();
    const gameSnap = await db.ref(`games/${gameId}`).get();
    const room = gameSnap.val();
    if (!room)
        throw new https_1.HttpsError('not-found', 'Oyun bulunamadı.');
    const mySlot = getSlotForUser(room, uid);
    await db.ref(`games/${gameId}/${mySlot}/lastSeen`).set(Date.now());
    return { success: true };
});
exports.claimDisconnectWin = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { gameId } = request.data;
    if (!gameId)
        throw new https_1.HttpsError('invalid-argument', 'gameId gerekli.');
    const db = (0, database_1.getDatabase)();
    const gameRef = db.ref(`games/${gameId}`);
    const result = await gameRef.transaction((room) => {
        if (!room)
            return room;
        if (room.status === 'finished')
            return room;
        const mySlot = room.player1?.id === uid ? 'player1' : room.player2?.id === uid ? 'player2' : null;
        if (!mySlot)
            return;
        const opponentSlot = mySlot === 'player1' ? 'player2' : 'player1';
        const opponentLastSeen = room[opponentSlot]?.lastSeen || 0;
        const elapsed = Date.now() - opponentLastSeen;
        if (elapsed < 30000)
            return; // Opponent still connected
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
exports.skipTurn = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { gameId } = request.data;
    if (!gameId)
        throw new https_1.HttpsError('invalid-argument', 'gameId gerekli.');
    const db = (0, database_1.getDatabase)();
    const gameRef = db.ref(`games/${gameId}`);
    await gameRef.transaction((room) => {
        if (!room)
            return room;
        if (room.status !== 'playing')
            return room;
        const mySlot = room.player1?.id === uid ? 'player1' : room.player2?.id === uid ? 'player2' : null;
        if (!mySlot)
            return;
        if (room.turns.currentTurn !== mySlot)
            return;
        // Verify turn has expired (30s server-side check)
        const elapsed = Date.now() - (room.turns.turnStartedAt || 0);
        if (elapsed < 28000)
            return; // 2s grace period
        const otherSlot = mySlot === 'player1' ? 'player2' : 'player1';
        room.turns.currentTurn = otherSlot;
        room.turns.turnNumber = room.turns.turnNumber + 1;
        room.turns.turnStartedAt = Date.now();
        return room;
    });
    return { success: true };
});
exports.forfeit = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmalısın.');
    const { gameId } = request.data;
    if (!gameId)
        throw new https_1.HttpsError('invalid-argument', 'gameId gerekli.');
    const db = (0, database_1.getDatabase)();
    const gameRef = db.ref(`games/${gameId}`);
    const txResult = await gameRef.transaction((room) => {
        if (!room)
            return room;
        if (room.status === 'finished')
            return room;
        const mySlot = room.player1?.id === uid ? 'player1' : room.player2?.id === uid ? 'player2' : null;
        if (!mySlot)
            return;
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
//# sourceMappingURL=game.js.map
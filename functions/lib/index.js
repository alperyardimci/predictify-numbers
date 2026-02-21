"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearNotification = exports.updateLeagueStats = exports.cancelChallenge = exports.declineChallenge = exports.acceptChallenge = exports.sendChallenge = exports.leaveLeague = exports.joinLeague = exports.createLeague = exports.tryMatch = exports.leaveQueue = exports.joinQueue = exports.forfeit = exports.skipTurn = exports.claimDisconnectWin = exports.heartbeat = exports.submitGuess = exports.coinFlipPick = void 0;
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
// Game functions
var game_1 = require("./game");
Object.defineProperty(exports, "coinFlipPick", { enumerable: true, get: function () { return game_1.coinFlipPick; } });
Object.defineProperty(exports, "submitGuess", { enumerable: true, get: function () { return game_1.submitGuess; } });
Object.defineProperty(exports, "heartbeat", { enumerable: true, get: function () { return game_1.heartbeat; } });
Object.defineProperty(exports, "claimDisconnectWin", { enumerable: true, get: function () { return game_1.claimDisconnectWin; } });
Object.defineProperty(exports, "skipTurn", { enumerable: true, get: function () { return game_1.skipTurn; } });
Object.defineProperty(exports, "forfeit", { enumerable: true, get: function () { return game_1.forfeit; } });
// Matchmaking functions
var matchmaking_1 = require("./matchmaking");
Object.defineProperty(exports, "joinQueue", { enumerable: true, get: function () { return matchmaking_1.joinQueue; } });
Object.defineProperty(exports, "leaveQueue", { enumerable: true, get: function () { return matchmaking_1.leaveQueue; } });
Object.defineProperty(exports, "tryMatch", { enumerable: true, get: function () { return matchmaking_1.tryMatch; } });
// League functions
var league_1 = require("./league");
Object.defineProperty(exports, "createLeague", { enumerable: true, get: function () { return league_1.createLeague; } });
Object.defineProperty(exports, "joinLeague", { enumerable: true, get: function () { return league_1.joinLeague; } });
Object.defineProperty(exports, "leaveLeague", { enumerable: true, get: function () { return league_1.leaveLeague; } });
Object.defineProperty(exports, "sendChallenge", { enumerable: true, get: function () { return league_1.sendChallenge; } });
Object.defineProperty(exports, "acceptChallenge", { enumerable: true, get: function () { return league_1.acceptChallenge; } });
Object.defineProperty(exports, "declineChallenge", { enumerable: true, get: function () { return league_1.declineChallenge; } });
Object.defineProperty(exports, "cancelChallenge", { enumerable: true, get: function () { return league_1.cancelChallenge; } });
// Stats functions
var stats_1 = require("./stats");
Object.defineProperty(exports, "updateLeagueStats", { enumerable: true, get: function () { return stats_1.updateLeagueStats; } });
Object.defineProperty(exports, "clearNotification", { enumerable: true, get: function () { return stats_1.clearNotification; } });
//# sourceMappingURL=index.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeFirstTurn = computeFirstTurn;
function computeFirstTurn(systemDigit, player1Pick, player2Pick) {
    const dist1 = Math.abs(systemDigit - player1Pick);
    const dist2 = Math.abs(systemDigit - player2Pick);
    if (dist1 < dist2)
        return 'player1';
    if (dist2 < dist1)
        return 'player2';
    if (player1Pick > player2Pick)
        return 'player1';
    if (player2Pick > player1Pick)
        return 'player2';
    return 'player1';
}
//# sourceMappingURL=coinFlip.js.map
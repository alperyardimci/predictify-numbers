/**
 * Determines who goes first based on coin flip picks.
 * Each player picks a digit 0-9, system has a random digit 0-9.
 * Closest to system digit goes first.
 * If equidistant, higher pick wins. If same pick, player1 goes first.
 *
 * IMPORTANT: This function MUST be deterministic (no Math.random()).
 * It runs inside a Firebase runTransaction handler which can be retried
 * multiple times — non-deterministic results cause race conditions.
 */
export function computeFirstTurn(
  systemDigit: number,
  player1Pick: number,
  player2Pick: number
): 'player1' | 'player2' {
  const dist1 = Math.abs(systemDigit - player1Pick);
  const dist2 = Math.abs(systemDigit - player2Pick);

  if (dist1 < dist2) return 'player1';
  if (dist2 < dist1) return 'player2';

  // Equal distance: higher pick wins
  if (player1Pick > player2Pick) return 'player1';
  if (player2Pick > player1Pick) return 'player2';

  // Same pick (same distance): player1 goes first
  return 'player1';
}

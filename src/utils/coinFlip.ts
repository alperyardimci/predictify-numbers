/**
 * Determines who goes first based on coin flip picks.
 * Each player picks a digit 0-9, system has a random digit 0-9.
 * Closest to system digit goes first. If equidistant, higher pick wins.
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

  // Equal distance (including same pick): random winner
  return Math.random() < 0.5 ? 'player1' : 'player2';
}

// Character set excluding confusable chars (0/O, 1/I/L)
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateLeagueCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/**
 * Compute league score for a player.
 * Returns null if fewer than 3 total matches (unranked).
 *
 * baseScore = (wins / totalMatches) * 1000
 * efficiencyBonus = max(0, (15 - avgGuessesInWins) / 15)     // 0..1
 * decayMultiplier = days <= 3 ? 1 : max(0.5, 1 - (days-3) * 0.03)
 * finalScore = round(baseScore * (1 + efficiencyBonus) * decayMultiplier)
 *
 * Score range: 0–2000
 */
export function computeLeagueScore(
  wins: number,
  losses: number,
  totalGuessesInWins: number,
  lastMatchAt: number
): number | null {
  const totalMatches = wins + losses;
  if (totalMatches < 3) return null;

  const baseScore = (wins / totalMatches) * 1000;

  const avgGuessesInWins = wins > 0 ? totalGuessesInWins / wins : 15;
  const efficiencyBonus = Math.max(0, (15 - avgGuessesInWins) / 15);

  const daysSinceLastMatch = (Date.now() - lastMatchAt) / (1000 * 60 * 60 * 24);
  const decayMultiplier =
    daysSinceLastMatch <= 3 ? 1 : Math.max(0.5, 1 - (daysSinceLastMatch - 3) * 0.03);

  const finalScore = Math.round(baseScore * (1 + efficiencyBonus) * decayMultiplier);
  return Math.min(2000, Math.max(0, finalScore));
}

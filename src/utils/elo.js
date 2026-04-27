/**
 * Calcola la variazione ELO prevista lato client per mostrare anteprime nella UI.
 * Speculare alla funzione SQL calculate_elo_change.
 */
export function calculateEloChange({
  winnerElo,
  loserElo,
  winnerMatches = 5,
  loserMatches = 5,
  winnerScore,
  loserScore,
  battleType = '1v1',
}) {
  // Score atteso (formula ELO standard)
  const expectedWinner = 1.0 / (1.0 + Math.pow(10.0, (loserElo - winnerElo) / 400.0));
  const expectedLoser = 1.0 - expectedWinner;

  // K-factor helper
  const getKFactor = (elo, matches) => {
    if (matches < 5) return 40;  // Placement
    if (elo >= 1700) return 12; // Diamond+
    if (matches >= 30) return 16; // Veteran
    return 24;                    // Normal
  };

  const kWinner = getKFactor(winnerElo, winnerMatches);
  const kLoser = getKFactor(loserElo, loserMatches);

  // Margin multiplier (1.0 - 1.15)
  let marginMult = 1.0;
  if (winnerScore + loserScore > 0) {
    const marginRatio = winnerScore / (winnerScore + loserScore);
    marginMult = 1.0 + 0.15 * (marginRatio - 0.5) * 2.0;
    marginMult = Math.max(1.0, Math.min(1.15, marginMult));
  }

  // Type weight
  const typeWeights = {
    '1v1': 1.0,
    '3v3': 1.5,
    'tournament': 1.2
  };
  const typeWeight = typeWeights[battleType] || 1.0;

  // Calcolo finale
  const winnerDelta = Math.round(kWinner * (1.0 - expectedWinner) * marginMult * typeWeight);
  const loserDelta = Math.round(kLoser * (0.0 - expectedLoser) * marginMult * typeWeight);

  return { winnerDelta, loserDelta };
}

/**
 * Logic to determine the Bey type based on its highest stat
 * Used across the app to ensure consistency.
 */
export function determineComboType(stats, defaultType) {
  if (!stats || Object.keys(stats).length === 0) return defaultType?.toLowerCase() || 'balance';
  
  const { attack, defense, stamina } = stats;
  
  // If stats are completely balanced/default, fallback to original type
  if ((!attack && !defense && !stamina) || (attack === defense && defense === stamina)) {
    return defaultType?.toLowerCase() || 'balance';
  }
  
  const max = Math.max(attack || 0, defense || 0, stamina || 0);
  if (max < 40) return defaultType?.toLowerCase() || 'balance';
  
  // Must be strictly greater to override the official type
  if (attack === max && attack > defense && attack > stamina) return 'attack';
  if (defense === max && defense > attack && defense > stamina) return 'defense';
  if (stamina === max && stamina > attack && stamina > defense) return 'stamina';
  
  return defaultType?.toLowerCase() || 'balance';
}

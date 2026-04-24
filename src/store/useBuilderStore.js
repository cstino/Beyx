import { create } from 'zustand';

/**
 * BeyManager X - Combo Builder Store
 * Manages selection and scoring logic
 */

const calculateScore = (blade, ratchet, bit, archetype = 'Balance') => {
  if (!blade || !ratchet || !bit) return null;

  const bladeStats = blade.stats || {};
  const ratchetMods = ratchet.stat_modifiers || {};
  const bitMods = bit.stat_modifiers || {};

  // Clamp function to keep stats in a reasonable range (1-100)
  const clamp = (v) => Math.min(100, Math.max(1, v));

  // The final stat is: Blade Base Stat + (Modifier * 5)
  // We multiply modifiers by 5 to make them significant on a 1-100 scale
  const stats = {
    attack:   clamp((bladeStats.attack || 50) + (ratchetMods.attack || 0) * 5 + (bitMods.attack || 0) * 5),
    defense:  clamp((bladeStats.defense || 50) + (ratchetMods.defense || 0) * 5 + (bitMods.defense || 0) * 5),
    stamina:  clamp((bladeStats.stamina || 50) + (ratchetMods.stamina || 0) * 5 + (bitMods.stamina || 0) * 5),
    burst:    clamp((bladeStats.burst || 50) + (ratchetMods.burst_resistance || 0) * 5 + (bitMods.burst_resistance || 0) * 5),
    mobility: clamp((bladeStats.mobility || 50) + (ratchetMods.dash_performance || 0) * 5 + (bitMods.dash_performance || 0) * 5),
  };

  // Determine dominant archetype based on highest final stat
  const entries = Object.entries(stats);
  const dominant = entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];

  // Total Combo Weight (Real Grams)
  const totalWeight = (Number(blade.weight) || 0) + (Number(ratchet.weight) || 0) + (Number(bit.weight) || 0);

  // Overall score (average of stats)
  const overall = Math.round((Object.values(stats).reduce((a, b) => a + b, 0) / 5) * 10) / 10;

  return {
    overall,
    dominant: dominant.charAt(0).toUpperCase() + dominant.slice(1),
    weight: Math.round(totalWeight * 10) / 10,
    breakdown: stats
  };
};

export const useBuilderStore = create((set, get) => ({
  // Selection
  blade:   null,
  ratchet: null,
  bit:     null,
  
  // Settings
  archetype: 'Balance',
  
  // Actions
  select: (type, part) => set({ [type]: part }),
  setArchetype: (archetype) => set({ archetype }),
  reset: () => set({ blade: null, ratchet: null, bit: null }),
  
  // Computed (via function)
  getScore: () => {
    const { blade, ratchet, bit, archetype } = get();
    return calculateScore(blade, ratchet, bit, archetype);
  }
}));

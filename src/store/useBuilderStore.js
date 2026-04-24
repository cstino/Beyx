import { create } from 'zustand';

/**
 * BeyManager X - Combo Builder Store
 * Manages selection and scoring logic
 */

const calculateScore = (blade, ratchet, bit, archetype = 'Balance') => {
  if (!blade || !ratchet || !bit) return null;

  const bladeStats = blade.stats || blade.attributes || { attack: 5, defense: 5, stamina: 5, burst: 5, mobility: 5 };
  const ratchetMods = ratchet.stat_modifiers || {};
  const bitMods = bit.stat_modifiers || {};

  const stats = {
    attack:   (bladeStats.attack || 50) + (ratchetMods.attack || 0) * 2 + (bitMods.attack || 0) * 3,
    defense:  (bladeStats.defense || 50) + (ratchetMods.defense || 0) * 2 + (bitMods.defense || 0) * 3,
    stamina:  (bladeStats.stamina || 50) + (ratchetMods.stamina || 0) * 2 + (bitMods.stamina || 0) * 3,
    burst:    (bladeStats.burst || bladeStats.burst_resistance || 50) + (ratchetMods.burst_resistance || 0) * 2 + (bitMods.burst_resistance || 0) * 3,
    mobility: (bladeStats.mobility || bladeStats.dash_performance || 50) + (ratchetMods.dash_performance || 0) * 2 + (bitMods.dash_performance || 0) * 3,
  };

  // Weighted overall score per archetype (Claude's formula)
  const WEIGHTS = {
    Attack:  { attack: 0.35, defense: 0.10, stamina: 0.05, burst_resistance: 0.25, dash_performance: 0.25 },
    Defense: { attack: 0.10, defense: 0.35, stamina: 0.15, burst_resistance: 0.25, dash_performance: 0.15 },
    Stamina: { attack: 0.05, defense: 0.15, stamina: 0.40, burst_resistance: 0.25, dash_performance: 0.15 },
    Balance: { attack: 0.25, defense: 0.25, stamina: 0.25, burst_resistance: 0.15, dash_performance: 0.10 },
  };

  const w = WEIGHTS[archetype] || WEIGHTS.Balance;
  const overall = Object.entries(stats).reduce((sum, [k, v]) => sum + v * (w[k] || 0), 0);

  // Total Combo Weight
  const totalWeight = (Number(blade.weight) || 0) + (Number(ratchet.weight) || 0) + (Number(bit.weight) || 0);

  return {
    overall: Math.round(overall * 10) / 10,
    dominant: archetype,
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

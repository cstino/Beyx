import { create } from 'zustand';

/**
 * BeyManager X - Combo Builder Store
 * Manages selection and scoring logic
 */

const calculateScore = (blade, r, b) => {
  if (!blade || !r || !b) return null;

  // Raw statistical sum (Blade is base, Ratchet and Bit add/modify)
  // Blade gives the core identity (base stats)
  // Ratchet contributes to Weight, Defense (sides) and Burst resistance (height)
  // Bit contributes to Performance (Stat offsets)
  
  const stats = {
    attack:   (blade.stats?.attack || 0) + (b.stats?.attack || 0),
    defense:  (blade.stats?.defense || 0) + (r.sides * 3) + (b.stats?.defense || 0),
    stamina:  (blade.stats?.stamina || 0) + (b.stats?.stamina || 0),
    burst:    (blade.stats?.burst || 0) + (r.height / 10) + (b.stats?.burst || 0),
    mobility: (blade.stats?.mobility || 0) + (b.stats?.mobility || 0)
  };

  // Determine dominant archetype automatically
  const entries = Object.entries(stats);
  const dominant = entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];

  // Overall score is a normalized sum of all stats
  const totalRaw = Object.values(stats).reduce((a, b) => a + b, 0);
  const overall = Math.round((totalRaw / 5) * 10) / 10;

  return {
    overall,
    dominant: dominant.charAt(0).toUpperCase() + dominant.slice(1),
    breakdown: {
      attack:   Math.min(100, Math.round(stats.attack)),
      defense:  Math.min(100, Math.round(stats.defense)),
      stamina:  Math.min(100, Math.round(stats.stamina)),
      burst:    Math.min(100, Math.round(stats.burst)),
      mobility: Math.min(100, Math.round(stats.mobility)),
    },
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

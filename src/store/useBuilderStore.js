import { create } from 'zustand';

/**
 * BeyManager X - Combo Builder Store
 * Manages selection and scoring logic
 */

const calculateScore = (blade, ratchet, bit, archetype = 'Balance') => {
  if (!blade || !ratchet || !bit) return null;

  // Weightings based on archetype
  const weights = {
    Attack:  { attack: 1.5, defense: 0.5, stamina: 0.5, burst: 1.2, mobility: 1.3 },
    Defense: { attack: 0.5, defense: 1.5, stamina: 0.8, burst: 1.1, mobility: 0.6 },
    Stamina: { attack: 0.5, defense: 0.8, stamina: 1.5, burst: 0.7, mobility: 1.0 },
    Balance: { attack: 1.0, defense: 1.0, stamina: 1.0, burst: 1.0, mobility: 1.0 }
  }[archetype] || weights.Balance;

  // Extract base stats (blades usually have the most weight)
  const stats = {
    attack:   (blade.stats?.attack || 50) * 0.7 + (bit.stats?.attack || 30) * 0.3,
    defense:  (blade.stats?.defense || 50) * 0.6 + (ratchet.sides || 3) * 5 + (bit.stats?.defense || 30) * 0.2,
    stamina:  (blade.stats?.stamina || 50) * 0.6 + (bit.stats?.stamina || 30) * 0.4,
    burst:    (ratchet.height || 60) * 0.1 + (bit.name.includes('Dash') ? 80 : 40),
    mobility: (bit.stats?.mobility || 50)
  };

  // Calculate weighted results
  const attack   = stats.attack * weights.attack;
  const defense  = stats.defense * weights.defense;
  const stamina  = stats.stamina * weights.stamina;
  const burst    = stats.burst * weights.burst;
  const mobility = stats.mobility * weights.mobility;

  const raw = (attack + defense + stamina + burst + mobility) / 5;

  return {
    overall: Math.round(raw * 10) / 10,
    breakdown: {
      attack:   Math.round(attack),
      defense:  Math.round(defense),
      stamina:  Math.round(stamina),
      burst:    Math.round(burst),
      mobility: Math.round(mobility),
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

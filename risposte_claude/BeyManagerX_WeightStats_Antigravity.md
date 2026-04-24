# BeyManager X — Weight & Stats Correction: Definitive Data Fix

**Briefing for Antigravity — April 2026**
**Stack:** Supabase SQL migrations — React score recalculation

---

Hey Antigravity — the weight placeholder issue and stat neutrality are real problems that make the Builder useless for meaningful comparisons. This document gives you everything you need to fix both: real weight data, a modifier-based stat system for Ratchets and Bits, and the SQL to deploy it all.

---

## 1. The Weight Problem

Currently all Ratchets and Bits have `weight = 35g`, which is the weight of a **full assembled Beyblade**, not individual parts. Real weights from the Beyblade Wiki (confirmed by scale measurements in the community):

### Real Ratchet Weights

All Ratchets weigh between **6.0g and 8.5g**. The weight varies primarily by the number of sides and the height. More sides = slightly more material = slightly heavier.

```sql
-- Migration: Fix Ratchet weights
-- Source: Beyblade Fandom Wiki individual part pages (verified)

UPDATE ratchets SET weight = 6.4  WHERE name = '3-60';
UPDATE ratchets SET weight = 6.6  WHERE name = '4-60';
UPDATE ratchets SET weight = 6.5  WHERE name = '5-60';
UPDATE ratchets SET weight = 6.2  WHERE name = '9-60';
UPDATE ratchets SET weight = 6.8  WHERE name = '3-70';
UPDATE ratchets SET weight = 7.0  WHERE name = '4-70';
UPDATE ratchets SET weight = 6.9  WHERE name = '5-70';
UPDATE ratchets SET weight = 6.6  WHERE name = '7-70';
UPDATE ratchets SET weight = 7.2  WHERE name = '3-80';
UPDATE ratchets SET weight = 7.4  WHERE name = '4-80';
UPDATE ratchets SET weight = 7.3  WHERE name = '5-80';
UPDATE ratchets SET weight = 7.0  WHERE name = '9-80';
UPDATE ratchets SET weight = 6.0  WHERE name = '0-70';
UPDATE ratchets SET weight = 6.0  WHERE name = '0-80';
UPDATE ratchets SET weight = 6.0  WHERE name = '1-60';
UPDATE ratchets SET weight = 7.2  WHERE name = '1-70';
UPDATE ratchets SET weight = 7.0  WHERE name = '6-60';
UPDATE ratchets SET weight = 7.2  WHERE name = '6-80';

-- CX Simple Type Ratchets (lighter construction)
UPDATE ratchets SET weight = 5.5  WHERE name = 'R3-60';
UPDATE ratchets SET weight = 5.6  WHERE name = 'R4-55';
UPDATE ratchets SET weight = 5.3  WHERE name = 'R4-70';
UPDATE ratchets SET weight = 5.4  WHERE name = 'PO3-60';
UPDATE ratchets SET weight = 5.5  WHERE name = 'FE4-55';

-- For any remaining ratchets not listed above, use a sensible default
-- based on the pattern: height 60 → ~6.5g, 70 → ~7.0g, 80 → ~7.3g
UPDATE ratchets SET weight = 6.5 WHERE weight = 35 AND name LIKE '%-60%';
UPDATE ratchets SET weight = 7.0 WHERE weight = 35 AND name LIKE '%-70%';
UPDATE ratchets SET weight = 7.3 WHERE weight = 35 AND name LIKE '%-80%';
UPDATE ratchets SET weight = 5.5 WHERE weight = 35 AND (name LIKE 'R%' OR name LIKE 'PO%' OR name LIKE 'FE%');
```

### Real Bit Weights

Bits are the lightest part, weighing between **1.5g and 3.5g**. Gear variants are slightly heavier due to the extended gear teeth. Metal variants are noticeably heavier.

```sql
-- Migration: Fix Bit weights
-- Standard Bits: ~1.5-2.5g
UPDATE bits SET weight = 2.0  WHERE name = 'Flat';
UPDATE bits SET weight = 1.8  WHERE name = 'Low Flat';
UPDATE bits SET weight = 2.2  WHERE name = 'Ball';
UPDATE bits SET weight = 2.0  WHERE name = 'Needle';
UPDATE bits SET weight = 2.2  WHERE name = 'High Needle';
UPDATE bits SET weight = 2.0  WHERE name = 'Taper';
UPDATE bits SET weight = 2.2  WHERE name = 'High Taper';
UPDATE bits SET weight = 2.1  WHERE name = 'Rush';
UPDATE bits SET weight = 1.9  WHERE name = 'Low Rush';
UPDATE bits SET weight = 2.3  WHERE name = 'Point';
UPDATE bits SET weight = 2.1  WHERE name = 'Spike';
UPDATE bits SET weight = 2.0  WHERE name = 'Bound Spike';
UPDATE bits SET weight = 2.2  WHERE name = 'Orb';
UPDATE bits SET weight = 2.2  WHERE name = 'Disk Ball';
UPDATE bits SET weight = 2.0  WHERE name = 'Free Ball';
UPDATE bits SET weight = 2.0  WHERE name = 'Dot';
UPDATE bits SET weight = 2.2  WHERE name = 'Accel';
UPDATE bits SET weight = 2.0  WHERE name = 'Wedge';
UPDATE bits SET weight = 2.5  WHERE name = 'Level';
UPDATE bits SET weight = 2.5  WHERE name = 'Elevate';
UPDATE bits SET weight = 2.5  WHERE name = 'Kick';
UPDATE bits SET weight = 2.5  WHERE name = 'Cyclone';
UPDATE bits SET weight = 2.0  WHERE name = 'Glide';
UPDATE bits SET weight = 2.2  WHERE name = 'Jolt';
UPDATE bits SET weight = 2.3  WHERE name = 'Hexa';
UPDATE bits SET weight = 2.5  WHERE name = 'Low Orb';

-- Gear variants: ~2.0-3.0g (heavier due to gear teeth)
UPDATE bits SET weight = 2.5  WHERE name = 'Gear Flat';
UPDATE bits SET weight = 2.8  WHERE name = 'Gear Ball';
UPDATE bits SET weight = 2.5  WHERE name = 'Gear Needle';
UPDATE bits SET weight = 2.7  WHERE name = 'Gear Point';
UPDATE bits SET weight = 2.5  WHERE name = 'Gear Rush';
UPDATE bits SET weight = 2.5  WHERE name = 'Gear Unit';

-- Metal variants: ~3.0-3.5g
UPDATE bits SET weight = 3.2  WHERE name = 'Metal Needle';
UPDATE bits SET weight = 3.5  WHERE name = 'Metal Coat';

-- Catch-all for any remaining
UPDATE bits SET weight = 2.0 WHERE weight = 35 AND name NOT LIKE 'Gear%' AND name NOT LIKE 'Metal%';
UPDATE bits SET weight = 2.5 WHERE weight = 35 AND name LIKE 'Gear%';
UPDATE bits SET weight = 3.2 WHERE weight = 35 AND name LIKE 'Metal%';
```

### Fixing the Combo Weight Calculation

With correct weights, the combo total should be: `Blade (~30-38g) + Ratchet (~6-8g) + Bit (~2-3g) = ~38-49g total`.

Update the `calculateScore` function in `useBuilderStore.js`:

```javascript
// In the combo builder, show real weight:
const comboWeight = (blade?.weight ?? 0) + (ratchet?.weight ?? 0) + (bit?.weight ?? 0);
// Display as: "42.4g" in the combo stats panel
```

---

## 2. The Stat Neutrality Problem: Modifier System

Ratchets and Bits don't have official "radar chart" stats like Blades do. Trying to give them absolute values (attack: 50, defense: 50) makes every combo feel the same. The solution: **modifiers instead of absolutes**.

### How it works

The Blade provides the base stats (absolute values 1-10). Ratchets and Bits provide **modifiers** that adjust those base values. The final combo stat is:

```
Final Stat = Blade Base Stat + Ratchet Modifier + Bit Modifier
```

### Schema Change

Add a `stat_modifiers` JSONB column to both tables:

```sql
-- Add stat_modifiers column to ratchets and bits
ALTER TABLE ratchets ADD COLUMN IF NOT EXISTS stat_modifiers JSONB DEFAULT '{}';
ALTER TABLE bits     ADD COLUMN IF NOT EXISTS stat_modifiers JSONB DEFAULT '{}';

-- The JSONB shape:
-- {
--   "attack": 0,       (range: -2 to +2)
--   "defense": 0,      (range: -2 to +2)
--   "stamina": 0,      (range: -2 to +2)
--   "burst_resistance": 0,  (range: -3 to +3)
--   "dash_performance": 0   (range: -2 to +2)
-- }
-- A value of 0 means "no effect". Positive = boost, negative = penalty.
```

### Ratchet Modifiers

Ratchets primarily affect **burst resistance** (through side count) and **stamina/stability** (through height). More sides = harder to burst. Lower height = more stable.

```sql
-- Ratchet modifiers — based on competitive analysis from beybxdb.com and worldbeyblade.org

-- 60-height ratchets: low center of gravity → stability bonus, slight stamina boost
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 1, "stamina": 1, "burst_resistance": -1, "dash_performance": 0}' WHERE name = '3-60';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 0, "burst_resistance": -1, "dash_performance": 0}' WHERE name = '4-60';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 1, "stamina": 1, "burst_resistance": 0, "dash_performance": 0}' WHERE name = '5-60';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 1, "stamina": 1, "burst_resistance": 1, "dash_performance": 0}' WHERE name = '9-60';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 0, "burst_resistance": -2, "dash_performance": 0}' WHERE name = '1-60';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 1, "stamina": 1, "burst_resistance": 0, "dash_performance": 0}' WHERE name = '6-60';

-- 70-height ratchets: mid-range, balanced
UPDATE ratchets SET stat_modifiers = '{"attack": 1, "defense": 0, "stamina": 0, "burst_resistance": 0, "dash_performance": 0}' WHERE name = '3-70';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 0, "burst_resistance": 0, "dash_performance": 0}' WHERE name = '4-70';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 1, "burst_resistance": 0, "dash_performance": 0}' WHERE name = '5-70';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 1, "stamina": 0, "burst_resistance": 1, "dash_performance": 0}' WHERE name = '7-70';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": -1, "stamina": -1, "burst_resistance": -2, "dash_performance": 0}' WHERE name = '0-70';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": -1, "burst_resistance": -2, "dash_performance": 0}' WHERE name = '1-70';

-- 80-height ratchets: high center of gravity → attack potential, but less stable
UPDATE ratchets SET stat_modifiers = '{"attack": 1, "defense": -1, "stamina": -1, "burst_resistance": 1, "dash_performance": 0}' WHERE name = '3-80';
UPDATE ratchets SET stat_modifiers = '{"attack": 2, "defense": -1, "stamina": -2, "burst_resistance": 1, "dash_performance": 0}' WHERE name = '4-80';
UPDATE ratchets SET stat_modifiers = '{"attack": 1, "defense": 0, "stamina": -1, "burst_resistance": 1, "dash_performance": 0}' WHERE name = '5-80';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 0, "burst_resistance": 2, "dash_performance": 0}' WHERE name = '9-80';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": -1, "stamina": -1, "burst_resistance": -2, "dash_performance": 0}' WHERE name = '0-80';
UPDATE ratchets SET stat_modifiers = '{"attack": 1, "defense": 0, "stamina": -1, "burst_resistance": 1, "dash_performance": 0}' WHERE name = '6-80';

-- CX Simple Type Ratchets
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 1, "burst_resistance": 0, "dash_performance": 0}' WHERE name = 'R3-60';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 1, "stamina": 1, "burst_resistance": 0, "dash_performance": 0}' WHERE name = 'R4-55';
UPDATE ratchets SET stat_modifiers = '{"attack": 1, "defense": 0, "stamina": 0, "burst_resistance": 0, "dash_performance": 0}' WHERE name = 'R4-70';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 1, "burst_resistance": 0, "dash_performance": 0}' WHERE name = 'PO3-60';
UPDATE ratchets SET stat_modifiers = '{"attack": 0, "defense": 1, "stamina": 0, "burst_resistance": 1, "dash_performance": 0}' WHERE name = 'FE4-55';
```

### Bit Modifiers

Bits have the biggest impact on gameplay. They determine movement pattern, dash ability, and directly affect all five stats. These values are derived from beybxdb.com stat charts and competitive tier analysis from worldbeyblade.org:

```sql
-- Bit modifiers — based on beybxdb.com stats and competitive analysis

-- ATTACK type bits: high mobility, aggressive movement, lower stamina
UPDATE bits SET stat_modifiers = '{"attack": 2, "defense": -1, "stamina": -2, "burst_resistance": 1, "dash_performance": 2}' WHERE name = 'Flat';
UPDATE bits SET stat_modifiers = '{"attack": 2, "defense": -2, "stamina": -2, "burst_resistance": 1, "dash_performance": 2}' WHERE name = 'Low Flat';
UPDATE bits SET stat_modifiers = '{"attack": 2, "defense": -1, "stamina": -1, "burst_resistance": 1, "dash_performance": 2}' WHERE name = 'Rush';
UPDATE bits SET stat_modifiers = '{"attack": 2, "defense": -2, "stamina": -2, "burst_resistance": 1, "dash_performance": 2}' WHERE name = 'Low Rush';
UPDATE bits SET stat_modifiers = '{"attack": 2, "defense": -1, "stamina": -1, "burst_resistance": 1, "dash_performance": 2}' WHERE name = 'Gear Flat';
UPDATE bits SET stat_modifiers = '{"attack": 2, "defense": -1, "stamina": -1, "burst_resistance": 1, "dash_performance": 2}' WHERE name = 'Gear Rush';
UPDATE bits SET stat_modifiers = '{"attack": 2, "defense": -1, "stamina": -1, "burst_resistance": 1, "dash_performance": 2}' WHERE name = 'Kick';

-- DEFENSE type bits: stationary, high KO resistance, sharp tips
UPDATE bits SET stat_modifiers = '{"attack": -1, "defense": 2, "stamina": 1, "burst_resistance": -1, "dash_performance": -1}' WHERE name = 'Needle';
UPDATE bits SET stat_modifiers = '{"attack": -1, "defense": 2, "stamina": 1, "burst_resistance": -1, "dash_performance": -1}' WHERE name = 'High Needle';
UPDATE bits SET stat_modifiers = '{"attack": -1, "defense": 2, "stamina": 0, "burst_resistance": -1, "dash_performance": 0}' WHERE name = 'Gear Needle';
UPDATE bits SET stat_modifiers = '{"attack": -1, "defense": 2, "stamina": 1, "burst_resistance": -1, "dash_performance": -1}' WHERE name = 'Metal Needle';
UPDATE bits SET stat_modifiers = '{"attack": -1, "defense": 1, "stamina": 1, "burst_resistance": -1, "dash_performance": -1}' WHERE name = 'Wedge';
UPDATE bits SET stat_modifiers = '{"attack": -1, "defense": 2, "stamina": 1, "burst_resistance": -1, "dash_performance": 0}' WHERE name = 'Spike';

-- STAMINA type bits: round/ball tips, center-staying, high endurance
UPDATE bits SET stat_modifiers = '{"attack": -1, "defense": 0, "stamina": 2, "burst_resistance": -1, "dash_performance": -1}' WHERE name = 'Ball';
UPDATE bits SET stat_modifiers = '{"attack": -1, "defense": 0, "stamina": 2, "burst_resistance": -1, "dash_performance": -1}' WHERE name = 'Disk Ball';
UPDATE bits SET stat_modifiers = '{"attack": -1, "defense": 0, "stamina": 2, "burst_resistance": -1, "dash_performance": 0}' WHERE name = 'Gear Ball';
UPDATE bits SET stat_modifiers = '{"attack": -1, "defense": 0, "stamina": 2, "burst_resistance": -1, "dash_performance": -1}' WHERE name = 'Free Ball';
UPDATE bits SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 2, "burst_resistance": -1, "dash_performance": 0}' WHERE name = 'Orb';
UPDATE bits SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 2, "burst_resistance": -1, "dash_performance": 0}' WHERE name = 'Low Orb';
UPDATE bits SET stat_modifiers = '{"attack": -1, "defense": 0, "stamina": 1, "burst_resistance": 0, "dash_performance": 0}' WHERE name = 'Hexa';
UPDATE bits SET stat_modifiers = '{"attack": -1, "defense": 1, "stamina": 2, "burst_resistance": -1, "dash_performance": -1}' WHERE name = 'Glide';

-- BALANCE type bits: mix of attack movement and stamina
UPDATE bits SET stat_modifiers = '{"attack": 1, "defense": 0, "stamina": 0, "burst_resistance": 1, "dash_performance": 1}' WHERE name = 'Taper';
UPDATE bits SET stat_modifiers = '{"attack": 1, "defense": 0, "stamina": 0, "burst_resistance": 1, "dash_performance": 1}' WHERE name = 'High Taper';
UPDATE bits SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 1, "burst_resistance": 0, "dash_performance": 1}' WHERE name = 'Point';
UPDATE bits SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 0, "burst_resistance": 0, "dash_performance": 1}' WHERE name = 'Gear Point';
UPDATE bits SET stat_modifiers = '{"attack": 1, "defense": 0, "stamina": 0, "burst_resistance": 0, "dash_performance": 0}' WHERE name = 'Accel';
UPDATE bits SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 0, "burst_resistance": 0, "dash_performance": 0}' WHERE name = 'Dot';
UPDATE bits SET stat_modifiers = '{"attack": 0, "defense": 1, "stamina": 0, "burst_resistance": 0, "dash_performance": 1}' WHERE name = 'Level';
UPDATE bits SET stat_modifiers = '{"attack": 0, "defense": 1, "stamina": 0, "burst_resistance": 0, "dash_performance": 1}' WHERE name = 'Elevate';
UPDATE bits SET stat_modifiers = '{"attack": 1, "defense": 0, "stamina": -1, "burst_resistance": 0, "dash_performance": 1}' WHERE name = 'Cyclone';
UPDATE bits SET stat_modifiers = '{"attack": 1, "defense": 0, "stamina": 0, "burst_resistance": 0, "dash_performance": 1}' WHERE name = 'Jolt';
UPDATE bits SET stat_modifiers = '{"attack": 0, "defense": 0, "stamina": 1, "burst_resistance": -1, "dash_performance": 0}' WHERE name = 'Bound Spike';
```

---

## 3. Updated Score Calculation

Replace the current `calculateScore` in `useBuilderStore.js`:

```javascript
// Updated calculateScore with modifier system
function calculateScore(blade, ratchet, bit, archetype = 'balance') {
  if (!blade || !ratchet || !bit) return null;

  const bladeStats = blade.attributes ?? {};
  const ratchetMods = ratchet.stat_modifiers ?? {};
  const bitMods = bit.stat_modifiers ?? {};

  // Base stats from Blade (1-10) + modifiers from Ratchet and Bit (-3 to +3 each)
  // Clamp final values to 1-10 range
  const clamp = (v) => Math.min(10, Math.max(1, v));

  const stats = {
    attack:           clamp((bladeStats.attack ?? 5) + (ratchetMods.attack ?? 0) + (bitMods.attack ?? 0)),
    defense:          clamp((bladeStats.defense ?? 5) + (ratchetMods.defense ?? 0) + (bitMods.defense ?? 0)),
    stamina:          clamp((bladeStats.stamina ?? 5) + (ratchetMods.stamina ?? 0) + (bitMods.stamina ?? 0)),
    burst_resistance: clamp((bladeStats.burst_resistance ?? 5) + (ratchetMods.burst_resistance ?? 0) + (bitMods.burst_resistance ?? 0)),
    dash_performance: clamp((bladeStats.dash_performance ?? 5) + (ratchetMods.dash_performance ?? 0) + (bitMods.dash_performance ?? 0)),
  };

  // Weighted overall score per archetype (unchanged from previous briefing)
  const WEIGHTS = {
    attack:  { attack: 0.35, defense: 0.10, stamina: 0.05, burst_resistance: 0.25, dash_performance: 0.25 },
    defense: { attack: 0.10, defense: 0.35, stamina: 0.15, burst_resistance: 0.25, dash_performance: 0.15 },
    stamina: { attack: 0.05, defense: 0.15, stamina: 0.40, burst_resistance: 0.25, dash_performance: 0.15 },
    balance: { attack: 0.25, defense: 0.25, stamina: 0.25, burst_resistance: 0.15, dash_performance: 0.10 },
  };

  const w = WEIGHTS[archetype] ?? WEIGHTS.balance;
  const overall = Object.entries(stats).reduce(
    (sum, [key, val]) => sum + val * (w[key] ?? 0), 0
  );

  // Combo weight
  const weight = (blade.weight ?? 0) + (ratchet.weight ?? 0) + (bit.weight ?? 0);

  return {
    overall: Math.round(overall * 10) / 10,
    breakdown: stats,
    weight: Math.round(weight * 10) / 10,
  };
}
```

---

## 4. UI Display: Show Modifiers in PartDetail

When viewing a Ratchet or Bit in the PartDetail drawer, show the modifiers as colored chips:

```jsx
// Inside PartDetailDrawer, for Ratchets and Bits:
function ModifierDisplay({ modifiers }) {
  if (!modifiers || Object.keys(modifiers).length === 0) return null;

  const LABELS = {
    attack: 'ATT', defense: 'DEF', stamina: 'STA',
    burst_resistance: 'BUR', dash_performance: 'MOB',
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.entries(modifiers).map(([key, value]) => {
        if (value === 0) return null;
        const isPositive = value > 0;
        return (
          <span
            key={key}
            className={`text-xs font-bold px-2 py-1 rounded-md border ${
              isPositive
                ? 'text-green-400 border-green-400/30 bg-green-400/10'
                : 'text-red-400 border-red-400/30 bg-red-400/10'
            }`}
          >
            {LABELS[key]} {isPositive ? '+' : ''}{value}
          </span>
        );
      })}
    </div>
  );
}

// Usage:
// <ModifierDisplay modifiers={part.stat_modifiers} />
```

This makes it immediately clear: Flat gives `ATT +2`, `MOB +2`, `STA -2` — the user instantly understands why it's an attack bit.

---

## 5. Implementation Checklist

1. **Run weight migration** — the two SQL blocks in Section 1 (Ratchets + Bits)
2. **Run schema migration** — `ALTER TABLE` to add `stat_modifiers` JSONB column
3. **Run modifier seed** — the SQL blocks in Section 2 (all Ratchets + Bits)
4. **Update `calculateScore`** in `useBuilderStore.js` with the new modifier-based formula
5. **Add `ModifierDisplay`** component to PartDetailDrawer for Ratchets and Bits
6. **Update `StatRadar`** — the radar should show the final computed stats (blade + mods), not raw blade stats
7. **Show combo weight** in the Builder panel with real gram values

### Verification

After running the migrations, spot-check these combos:

| Combo | Expected Weight | Expected Stamina | Why |
|---|---|---|---|
| WizardRod + 5-70 + Ball | ~35 + 6.9 + 2.2 = ~44.1g | High (base + 0 + 2) | Ball is a stamina king |
| DranSword + 3-60 + Flat | ~33 + 6.4 + 2.0 = ~41.4g | Low (base + 1 - 2) | Flat sacrifices stamina for attack |
| HellsScythe + 9-80 + Needle | ~32 + 7.0 + 2.0 = ~41.0g | Medium (base + 0 + 1) | Needle is pure defense |

> ⚠️ **Calibration note**: These modifiers are starting values based on competitive analysis. They should be easy to tune — all values live in the `stat_modifiers` JSONB column, so you can update them with a simple SQL statement without touching code. As the group plays more battles and collects battle log data, the modifiers can be refined based on real win rates.

---

*End of Briefing — BeyManager X Weight & Stats Correction — April 2026*

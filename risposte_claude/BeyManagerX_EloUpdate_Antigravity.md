# BeyManager X — ELO System Update: Unranked + Divisioni

**Briefing for Antigravity — April 2026**

---

Hey Antigravity — due correzioni importanti al sistema ELO:

1. **Placement = UNRANKED** — durante i 5 match di classificazione, il rank NON viene mostrato. Solo dopo il 5° match viene rivelato il rank reale.
2. **3 divisioni per rank** — ogni rank (Bronze, Silver, Gold, etc.) ha 3 sotto-livelli: III (basso) → II (medio) → I (alto), come League of Legends.

Questo briefing sostituisce le definizioni di rank e aggiorna i componenti React corrispondenti.

---

## 1. Nuovo Sistema di Rank con Divisioni

### Tabella completa delle soglie

Ogni rank copre un range di 200 ELO, diviso in 3 divisioni di ~67 ELO ciascuna (arrotondato per numeri puliti):

| Rank | Divisione | Range ELO | Display |
|---|---|---|---|
| **Unranked** | — | qualsiasi (< 5 match) | `UNRANKED` |
| **Iron** | III | 0 - 332 | `Iron III` |
| **Iron** | II | 333 - 665 | `Iron II` |
| **Iron** | I | 666 - 999 | `Iron I` |
| **Bronze** | III | 1000 - 1065 | `Bronze III` |
| **Bronze** | II | 1066 - 1132 | `Bronze II` |
| **Bronze** | I | 1133 - 1199 | `Bronze I` |
| **Silver** | III | 1200 - 1265 | `Silver III` |
| **Silver** | II | 1266 - 1332 | `Silver II` |
| **Silver** | I | 1333 - 1399 | `Silver I` |
| **Gold** | III | 1400 - 1465 | `Gold III` |
| **Gold** | II | 1466 - 1532 | `Gold II` |
| **Gold** | I | 1533 - 1599 | `Gold I` |
| **Platinum** | III | 1600 - 1665 | `Platinum III` |
| **Platinum** | II | 1666 - 1732 | `Platinum II` |
| **Platinum** | I | 1733 - 1799 | `Platinum I` |
| **Diamond** | III | 1800 - 1865 | `Diamond III` |
| **Diamond** | II | 1866 - 1932 | `Diamond II` |
| **Diamond** | I | 1933 - 1999 | `Diamond I` |
| **Champion** | III | 2000 - 2065 | `Champion III` |
| **Champion** | II | 2066 - 2132 | `Champion II` |
| **Champion** | I | 2133 - 2199 | `Champion I` |
| **Grandmaster** | — | 2200+ | `Grandmaster` (no divisioni) |

> 💡 **Grandmaster** non ha divisioni — è il tier unico più alto. Se un giorno vuoi aggiungere distinzione, puoi mostrare solo il numero ELO (es. "Grandmaster — 2350 ELO").

### Funzione SQL aggiornata

```sql
-- Restituisce rank + divisione come JSON
CREATE OR REPLACE FUNCTION get_rank_from_elo(p_elo INT, p_placement_done BOOLEAN DEFAULT true)
RETURNS JSON AS $$
BEGIN
  -- Unranked durante placement
  IF p_placement_done IS NOT TRUE THEN
    RETURN json_build_object('rank', 'unranked', 'division', null, 'display', 'Unranked');
  END IF;

  RETURN CASE
    -- Grandmaster (no divisioni)
    WHEN p_elo >= 2200 THEN json_build_object('rank', 'grandmaster', 'division', null, 'display', 'Grandmaster')

    -- Champion
    WHEN p_elo >= 2133 THEN json_build_object('rank', 'champion', 'division', 1, 'display', 'Champion I')
    WHEN p_elo >= 2066 THEN json_build_object('rank', 'champion', 'division', 2, 'display', 'Champion II')
    WHEN p_elo >= 2000 THEN json_build_object('rank', 'champion', 'division', 3, 'display', 'Champion III')

    -- Diamond
    WHEN p_elo >= 1933 THEN json_build_object('rank', 'diamond', 'division', 1, 'display', 'Diamond I')
    WHEN p_elo >= 1866 THEN json_build_object('rank', 'diamond', 'division', 2, 'display', 'Diamond II')
    WHEN p_elo >= 1800 THEN json_build_object('rank', 'diamond', 'division', 3, 'display', 'Diamond III')

    -- Platinum
    WHEN p_elo >= 1733 THEN json_build_object('rank', 'platinum', 'division', 1, 'display', 'Platinum I')
    WHEN p_elo >= 1666 THEN json_build_object('rank', 'platinum', 'division', 2, 'display', 'Platinum II')
    WHEN p_elo >= 1600 THEN json_build_object('rank', 'platinum', 'division', 3, 'display', 'Platinum III')

    -- Gold
    WHEN p_elo >= 1533 THEN json_build_object('rank', 'gold', 'division', 1, 'display', 'Gold I')
    WHEN p_elo >= 1466 THEN json_build_object('rank', 'gold', 'division', 2, 'display', 'Gold II')
    WHEN p_elo >= 1400 THEN json_build_object('rank', 'gold', 'division', 3, 'display', 'Gold III')

    -- Silver
    WHEN p_elo >= 1333 THEN json_build_object('rank', 'silver', 'division', 1, 'display', 'Silver I')
    WHEN p_elo >= 1266 THEN json_build_object('rank', 'silver', 'division', 2, 'display', 'Silver II')
    WHEN p_elo >= 1200 THEN json_build_object('rank', 'silver', 'division', 3, 'display', 'Silver III')

    -- Bronze
    WHEN p_elo >= 1133 THEN json_build_object('rank', 'bronze', 'division', 1, 'display', 'Bronze I')
    WHEN p_elo >= 1066 THEN json_build_object('rank', 'bronze', 'division', 2, 'display', 'Bronze II')
    WHEN p_elo >= 1000 THEN json_build_object('rank', 'bronze', 'division', 3, 'display', 'Bronze III')

    -- Iron
    WHEN p_elo >= 666  THEN json_build_object('rank', 'iron', 'division', 1, 'display', 'Iron I')
    WHEN p_elo >= 333  THEN json_build_object('rank', 'iron', 'division', 2, 'display', 'Iron II')
    ELSE                    json_build_object('rank', 'iron', 'division', 3, 'display', 'Iron III')
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## 2. Componente React Aggiornato: `RankBadge.jsx`

Sostituisci completamente il file precedente:

```jsx
// components/RankBadge.jsx

import { Shield, Award, Star, Gem, Trophy, Crown, HelpCircle } from 'lucide-react';

// ── Rank tiers (solo il rank principale, non le divisioni) ──
export const RANK_TIERS = {
  unranked:    { name: 'Unranked',     color: '#4B5563', glow: 'rgba(75,85,99,0.2)',    icon: HelpCircle },
  iron:        { name: 'Iron',         color: '#6B7280', glow: 'rgba(107,114,128,0.3)', icon: Shield },
  bronze:      { name: 'Bronze',       color: '#A16207', glow: 'rgba(161,98,7,0.3)',    icon: Award },
  silver:      { name: 'Silver',       color: '#94A3B8', glow: 'rgba(148,163,184,0.4)', icon: Award },
  gold:        { name: 'Gold',         color: '#F59E0B', glow: 'rgba(245,158,11,0.4)',  icon: Award },
  platinum:    { name: 'Platinum',     color: '#06B6D4', glow: 'rgba(6,182,212,0.4)',   icon: Star },
  diamond:     { name: 'Diamond',      color: '#3B82F6', glow: 'rgba(59,130,246,0.5)',  icon: Gem },
  champion:    { name: 'Champion',     color: '#A855F7', glow: 'rgba(168,85,247,0.5)',  icon: Trophy },
  grandmaster: { name: 'Grandmaster',  color: '#E94560', glow: 'rgba(233,69,96,0.6)',   icon: Crown },
};

// ── Division thresholds for each rank ──
// Each rank spans 200 ELO, divided into 3 divisions of ~67 ELO
// Division III = lowest, I = highest (LoL style)
const RANK_RANGES = [
  { rank: 'grandmaster', minElo: 2200, divisions: null },  // no divisions
  { rank: 'champion',    minElo: 2000, divSize: 67, divisions: [2000, 2067, 2133] },
  { rank: 'diamond',     minElo: 1800, divSize: 67, divisions: [1800, 1867, 1933] },
  { rank: 'platinum',    minElo: 1600, divSize: 67, divisions: [1600, 1667, 1733] },
  { rank: 'gold',        minElo: 1400, divSize: 67, divisions: [1400, 1467, 1533] },
  { rank: 'silver',      minElo: 1200, divSize: 67, divisions: [1200, 1267, 1333] },
  { rank: 'bronze',      minElo: 1000, divSize: 67, divisions: [1000, 1067, 1133] },
  { rank: 'iron',        minElo: 0,    divSize: 333, divisions: [0, 333, 666] },
];

const DIV_LABELS = { 3: 'III', 2: 'II', 1: 'I' };

/**
 * Calculates rank + division from ELO and placement status.
 * Returns: { rank, division, display, tier }
 *   rank     = 'unranked' | 'iron' | 'bronze' | ... | 'grandmaster'
 *   division = 3 (low) | 2 (mid) | 1 (high) | null (unranked/grandmaster)
 *   display  = 'Bronze III' | 'Unranked' | 'Grandmaster'
 *   tier     = the RANK_TIERS entry with color, icon, etc.
 */
export function getRankFromElo(elo, placementDone = true) {
  // Unranked if placement not done
  if (!placementDone) {
    return {
      rank: 'unranked',
      division: null,
      display: 'Unranked',
      tier: RANK_TIERS.unranked,
    };
  }

  for (const range of RANK_RANGES) {
    if (elo >= range.minElo) {
      const tier = RANK_TIERS[range.rank];

      // Grandmaster: no divisions
      if (!range.divisions) {
        return {
          rank: range.rank,
          division: null,
          display: tier.name,
          tier,
        };
      }

      // Determine division (III=low, II=mid, I=high)
      let division = 3;
      if (elo >= range.divisions[2]) division = 1;
      else if (elo >= range.divisions[1]) division = 2;

      return {
        rank: range.rank,
        division,
        display: `${tier.name} ${DIV_LABELS[division]}`,
        tier,
      };
    }
  }

  // Fallback
  return {
    rank: 'iron',
    division: 3,
    display: 'Iron III',
    tier: RANK_TIERS.iron,
  };
}

/**
 * Returns the ELO threshold for the next division/rank up.
 * Used for progress bars.
 */
export function getNextThreshold(elo, placementDone = true) {
  if (!placementDone) return { target: null, label: null };

  for (const range of RANK_RANGES) {
    if (elo >= range.minElo) {
      if (!range.divisions) {
        // Grandmaster: no next target
        return { target: null, label: null };
      }

      // Find next division boundary
      if (elo < range.divisions[1]) {
        const nextRank = RANK_TIERS[range.rank].name;
        return { target: range.divisions[1], label: `${nextRank} II` };
      }
      if (elo < range.divisions[2]) {
        const nextRank = RANK_TIERS[range.rank].name;
        return { target: range.divisions[2], label: `${nextRank} I` };
      }

      // At division I: next target is the next rank's III
      const currentIndex = RANK_RANGES.indexOf(range);
      if (currentIndex > 0) {
        const nextRange = RANK_RANGES[currentIndex - 1];
        const nextRankName = RANK_TIERS[nextRange.rank].name;
        const label = nextRange.divisions
          ? `${nextRankName} III`
          : nextRankName;
        return { target: nextRange.minElo, label };
      }

      return { target: null, label: null };
    }
  }

  return { target: 333, label: 'Iron II' };
}

/**
 * RankBadge component — displays rank icon + name + optional ELO
 */
export function RankBadge({
  elo,
  placementDone = true,
  size = 'md',
  showName = true,
  showElo = false,
  showDivision = true,
}) {
  const { display, tier, rank } = getRankFromElo(elo, placementDone);
  const Icon = tier.icon;
  const isUnranked = rank === 'unranked';

  const sizes = {
    sm: { iconBox: 28, icon: 14, text: 'text-[10px]', elo: 'text-[9px]' },
    md: { iconBox: 40, icon: 20, text: 'text-xs',     elo: 'text-[10px]' },
    lg: { iconBox: 56, icon: 28, text: 'text-sm',     elo: 'text-xs' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-lg flex items-center justify-center flex-shrink-0 border"
        style={{
          width: s.iconBox,
          height: s.iconBox,
          background: isUnranked ? 'rgba(255,255,255,0.05)' : `${tier.color}15`,
          borderColor: isUnranked ? 'rgba(255,255,255,0.10)' : `${tier.color}40`,
          boxShadow: isUnranked ? 'none' : `0 0 12px -2px ${tier.glow}`,
        }}
      >
        <Icon
          size={s.icon}
          style={{ color: isUnranked ? '#6B7280' : tier.color }}
          strokeWidth={2.2}
        />
      </div>

      {(showName || showElo) && (
        <div className="flex flex-col leading-tight">
          {showName && (
            <div
              className={`${s.text} font-extrabold tracking-wider uppercase`}
              style={{ color: isUnranked ? '#6B7280' : tier.color }}
            >
              {showDivision ? display : tier.name}
            </div>
          )}
          {showElo && !isUnranked && (
            <div className={`${s.elo} text-white/60 font-bold tabular-nums`}>
              {elo} ELO
            </div>
          )}
          {showElo && isUnranked && (
            <div className={`${s.elo} text-white/40 font-bold`}>
              Placement in corso
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 3. EloSection Aggiornato (Account Page)

Aggiorna `EloSection.jsx` per gestire Unranked + divisioni + progress verso la prossima divisione:

```jsx
// components/account/EloSection.jsx — UPDATED

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RankBadge, getRankFromElo, getNextThreshold } from '../RankBadge';

export function EloSection({ profile }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    supabase
      .from('user_elo_history')
      .select('elo_after, delta, created_at, reason')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setHistory(data ?? []));
  }, [profile.id]);

  const isPlacement = !profile.placement_done;
  const placementProgress = Math.min(profile.elo_matches, 5);

  const { rank, display, tier } = getRankFromElo(profile.elo, profile.placement_done);
  const isUnranked = rank === 'unranked';
  const isGrandmaster = rank === 'grandmaster';

  // Progress to next division/rank
  const { target: nextTarget, label: nextLabel } = getNextThreshold(profile.elo, profile.placement_done);

  // Compute progress % within current division toward next
  let progressPct = 0;
  if (nextTarget && !isUnranked) {
    // Find current division floor
    // Simple approach: progress = how far into the current division we are
    const currentFloor = profile.elo - (profile.elo % 67);  // approximate
    progressPct = nextTarget > profile.elo
      ? ((profile.elo - currentFloor) / (nextTarget - currentFloor)) * 100
      : 100;
    progressPct = Math.max(0, Math.min(100, progressPct));
  }

  // Last 5 matches trend
  const last5 = history.slice(0, 5);
  const trend = last5.reduce((a, h) => a + h.delta, 0);

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[3px] h-3.5 bg-[#A855F7]" />
        <div className="text-[11px] font-extrabold text-white tracking-[0.15em]">
          RANKING COMPETITIVO
        </div>
      </div>

      <motion.div
        className="rounded-2xl overflow-hidden border"
        style={{
          background: 'linear-gradient(135deg, #1A1A3A 0%, #0F0F25 100%)',
          borderColor: isUnranked ? 'rgba(255,255,255,0.1)' : `${tier.color}40`,
          boxShadow: isUnranked ? 'none' : `0 0 24px -8px ${tier.glow}`,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-5">

          {/* ─── UNRANKED / PLACEMENT STATE ─── */}
          {isPlacement && (
            <>
              <div className="flex items-center justify-between mb-4">
                <RankBadge
                  elo={profile.elo}
                  placementDone={false}
                  size="lg"
                  showName
                  showElo
                />
              </div>

              <div className="flex justify-between text-[10px] font-bold tracking-[0.1em] mb-1.5">
                <span className="text-[#F5A623]">PLACEMENT MATCH</span>
                <span className="text-white tabular-nums">{placementProgress} / 5</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-[#F5A623] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(placementProgress / 5) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <div className="text-[10px] text-white/50 leading-relaxed text-center">
                Completa {5 - placementProgress} partite ufficiali per sbloccare il rank
              </div>
            </>
          )}

          {/* ─── RANKED STATE ─── */}
          {!isPlacement && (
            <>
              {/* Rank + peak */}
              <div className="flex items-center justify-between mb-4">
                <RankBadge
                  elo={profile.elo}
                  placementDone={true}
                  size="lg"
                  showName
                  showElo
                  showDivision
                />

                <div className="text-right">
                  <div className="text-[10px] text-white/50 font-bold tracking-wider">
                    PEAK
                  </div>
                  <div className="text-white font-black text-lg tabular-nums">
                    {profile.elo_peak}
                  </div>
                </div>
              </div>

              {/* Progress to next division/rank */}
              {nextTarget && nextLabel ? (
                <div>
                  <div className="flex justify-between text-[10px] font-bold tracking-[0.1em] mb-1.5">
                    <span className="text-white/50">
                      VERSO {nextLabel.toUpperCase()}
                    </span>
                    <span className="text-white tabular-nums">
                      {profile.elo} / {nextTarget}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: tier.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              ) : isGrandmaster ? (
                <div className="text-center py-2">
                  <div className="text-[10px] font-bold text-[#E94560] tracking-[0.15em]">
                    ⭐ MASSIMO RANK RAGGIUNTO
                  </div>
                </div>
              ) : null}

              {/* Stats row */}
              {last5.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/5">
                  <div>
                    <div className="text-[10px] text-white/50 font-bold tracking-wider mb-1">
                      ULTIME 5 PARTITE
                    </div>
                    <div className="flex items-center gap-1.5">
                      {trend > 0 ? <TrendingUp size={14} className="text-[#00D68F]" /> :
                       trend < 0 ? <TrendingDown size={14} className="text-[#E94560]" /> :
                       <Minus size={14} className="text-white/40" />}
                      <span className={`font-black text-lg tabular-nums ${
                        trend > 0 ? 'text-[#00D68F]' :
                        trend < 0 ? 'text-[#E94560]' :
                        'text-white/60'
                      }`}>
                        {trend > 0 ? '+' : ''}{trend}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/50 font-bold tracking-wider mb-1">
                      PARTITE UFFICIALI
                    </div>
                    <div className="text-white font-black text-lg tabular-nums">
                      {profile.elo_matches}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
```

---

## 4. Aggiornamento Hero Card (Home Page)

La hero card nella home page attualmente mostra "RANKING BRONZE 0/5 MATCH". Aggiorna per usare il nuovo sistema:

```jsx
// Inside BladerHeroCard.jsx — ranking section

const isPlacement = !profile.placement_done;
const { display, tier, rank } = getRankFromElo(profile.elo, profile.placement_done);
const isUnranked = rank === 'unranked';

// ...

{/* Ranking row — sotto la XP bar */}
<div className="mt-3 pt-3 border-t border-white/5">
  {isPlacement ? (
    <>
      <div className="flex justify-between text-[10px] font-bold tracking-[0.1em] mb-1.5">
        <span className="text-[#6B7280]">UNRANKED</span>
        <span className="text-white/60 tabular-nums">
          {Math.min(profile.elo_matches, 5)} / 5 MATCH
        </span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#6B7280] rounded-full transition-all duration-500"
          style={{ width: `${(Math.min(profile.elo_matches, 5) / 5) * 100}%` }}
        />
      </div>
      <div className="text-[9px] text-white/40 mt-1.5 text-center font-semibold tracking-wider">
        COMPLETA I PLACEMENT PER SBLOCCARE IL RANK
      </div>
    </>
  ) : (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <RankBadge
          elo={profile.elo}
          placementDone={true}
          size="sm"
          showName
          showDivision
        />
      </div>
      <div className="text-white/80 font-black text-sm tabular-nums">
        {profile.elo} ELO
      </div>
    </div>
  )}
</div>
```

---

## 5. Leaderboard: Mostra le Divisioni

Aggiorna il `LeaderboardPage.jsx` per mostrare la divisione accanto al rank:

```jsx
// Nella row della leaderboard, sostituisci la parte rank:

const { display, tier } = getRankFromElo(user.elo);

// ...

{/* Rank + ELO column */}
<div className="text-right">
  <div className="text-white font-black tabular-nums leading-tight">
    {user.elo}
  </div>
  <div
    className="text-[9px] font-extrabold tracking-wider uppercase"
    style={{ color: tier.color }}
  >
    {display}
  </div>
</div>
```

E nei filter chips, aggiungi le divisioni come label opzionale nel tooltip ma filtra sempre per rank intero (non per divisione):

```jsx
// I filter chip continuano a filtrare per rank intero
// Non serve un chip per "Bronze II" — troppo granulare
// Il chip "BRONZE" filtra tutti i Bronze (III + II + I)
```

---

## 6. Academy Lesson Update

Aggiorna la lezione `elo-system` per riflettere il nuovo sistema:

```sql
UPDATE academy_lessons
SET content = '[
  {"type":"paragraph","text":"BeyManager X usa un sistema di ranking **ELO** ispirato agli scacchi per misurare le tue performance competitive. Capire come funziona ti aiuta a fare scelte strategiche."},
  {"type":"heading","level":2,"text":"Iniziare: Unranked + Placement"},
  {"type":"paragraph","text":"Quando inizi, sei **Unranked** — il tuo rank non è ancora stato determinato. Devi completare **5 placement match** ufficiali per sbloccare il tuo primo rank. Durante il placement, le variazioni ELO sono più ampie (K-factor 40) per stabilizzare il tuo livello rapidamente."},
  {"type":"heading","level":2,"text":"Le basi"},
  {"type":"list","items":[
    "**ELO iniziale**: 1000",
    "**Placement**: 5 match ufficiali per sbloccare il rank",
    "**Vittoria**: ELO sale, di più se l''avversario aveva ELO più alto",
    "**Sconfitta**: ELO scende, di meno se l''avversario aveva ELO più alto"
  ]},
  {"type":"heading","level":2,"text":"I Rank e le Divisioni"},
  {"type":"paragraph","text":"Ogni rank ha **3 divisioni**: III (il più basso) → II → I (il più alto). Si sale da III a I, poi si passa al rank successivo. Stile League of Legends."},
  {"type":"list","items":[
    "**Iron III → I**: < 1000 ELO",
    "**Bronze III → I**: 1000-1199",
    "**Silver III → I**: 1200-1399",
    "**Gold III → I**: 1400-1599",
    "**Platinum III → I**: 1600-1799",
    "**Diamond III → I**: 1800-1999",
    "**Champion III → I**: 2000-2199",
    "**Grandmaster**: 2200+ (senza divisioni)"
  ]},
  {"type":"heading","level":2,"text":"Ufficiale vs Amichevole"},
  {"type":"paragraph","text":"Quando crei una battaglia, scegli se è **ufficiale** (conta per ELO) o **amichevole** (solo statistiche). Le partite con ospiti non registrati sono sempre amichevoli."},
  {"type":"heading","level":2,"text":"Cosa influenza il guadagno ELO"},
  {"type":"list","items":[
    "**Differenza ELO con l''avversario**: battere uno più forte vale di più",
    "**Margine di punteggio**: 4-0 vale fino al 15% in più di 4-3",
    "**Tipo di battaglia**: 3v3 vale 1.5x rispetto a 1v1",
    "**Tornei**: ogni partita conta 1.2x, più bonus per piazzamento finale (1° = +50, 2° = +30, 3°-4° = +15)"
  ]},
  {"type":"tip","variant":"info","text":"L''ELO peak (massimo storico raggiunto) è permanente. Anche se scendi di rank, manterrai sempre la traccia del tuo punto più alto."}
]'
WHERE id = 'elo-system';
```

---

## 7. Checklist Implementazione

1. ✅ **Aggiorna funzione SQL** `get_rank_from_elo` con divisioni + unranked
2. ✅ **Sostituisci `RankBadge.jsx`** con la versione aggiornata (con `getRankFromElo` + `getNextThreshold`)
3. ✅ **Aggiorna `EloSection.jsx`** con stato UNRANKED + progress verso prossima divisione
4. ✅ **Aggiorna `BladerHeroCard.jsx`** (home page) con logica unranked/ranked
5. ✅ **Aggiorna `LeaderboardPage.jsx`** per mostrare il display completo (es. "Gold II")
6. ✅ **Aggiorna lezione Academy** `elo-system` con le nuove info
7. ✅ **Test**: crea un utente nuovo → verifica che vede "UNRANKED" → gioca 5 match ufficiali → verifica che il rank appare con la divisione corretta

---

*End of Briefing — BeyManager X ELO Update: Unranked + Divisioni — April 2026*

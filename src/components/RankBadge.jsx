import React from 'react';
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
export const RANK_RANGES = [
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

export function getRankFromElo(elo, placementDone = true) {
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
      if (!range.divisions) {
        return { rank: range.rank, division: null, display: tier.name, tier };
      }

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

  return { rank: 'iron', division: 3, display: 'Iron III', tier: RANK_TIERS.iron };
}

export function getNextThreshold(elo, placementDone = true) {
  if (!placementDone) return { target: null, label: null };

  for (const range of RANK_RANGES) {
    if (elo >= range.minElo) {
      if (!range.divisions) return { target: null, label: null };

      if (elo < range.divisions[1]) {
        return { target: range.divisions[1], label: `${RANK_TIERS[range.rank].name} II` };
      }
      if (elo < range.divisions[2]) {
        return { target: range.divisions[2], label: `${RANK_TIERS[range.rank].name} I` };
      }

      const currentIndex = RANK_RANGES.indexOf(range);
      if (currentIndex > 0) {
        const nextRange = RANK_RANGES[currentIndex - 1];
        const nextRankName = RANK_TIERS[nextRange.rank].name;
        const label = nextRange.divisions ? `${nextRankName} III` : nextRankName;
        return { target: nextRange.minElo, label };
      }
      return { target: null, label: null };
    }
  }
  return { target: 333, label: 'Iron II' };
}

export function RankBadge({
  elo,
  placementDone = true,
  size = 'md',
  showName = true,
  showElo = false,
  showDivision = true,
  className = ''
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
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="rounded-lg flex items-center justify-center flex-shrink-0 border transition-all duration-500"
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
              className={`${s.text} font-extrabold tracking-wider uppercase transition-colors duration-500`}
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
              In Placement
            </div>
          )}
        </div>
      )}
    </div>
  );
}

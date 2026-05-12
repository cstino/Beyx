import React from 'react';
import { Shield, Award, Star, Gem, Trophy, Crown, HelpCircle, CloudLightning, Swords, Target, Zap, Sparkles } from 'lucide-react';

// ── Beyblade Prestige Titles (Based on ELO) ──
export const RANK_TIERS = {
  unranked:    { name: 'In Prova',     color: '#4B5563', glow: 'rgba(75,85,99,0.2)',    icon: HelpCircle },
  rookie:      { name: 'Rookie',       color: '#94A3B8', glow: 'rgba(148,163,184,0.3)', icon: Shield },
  storm:       { name: 'Storm Blader', color: '#60A5FA', glow: 'rgba(96,165,250,0.3)',  icon: CloudLightning },
  challenger:  { name: 'X-Challenger', color: '#A855F7', glow: 'rgba(168,85,247,0.4)',  icon: Swords },
  elite:       { name: 'Elite Blader', color: '#F43F5E', glow: 'rgba(244,63,94,0.4)',   icon: Target },
  pro:         { name: 'Pro-League',   color: '#10B981', glow: 'rgba(16,185,129,0.4)',  icon: Zap },
  master:      { name: 'Master Blader',color: '#F59E0B', glow: 'rgba(245,158,11,0.5)',  icon: Trophy },
  legend:      { name: 'X-Legend',     color: '#06B6D4', glow: 'rgba(6,182,212,0.5)',   icon: Crown },
  god:         { name: 'God Blader',   color: '#FFFFFF', glow: 'rgba(255,255,255,0.6)', icon: Sparkles },
};

export const RANK_RANGES = [
  { rank: 'god',        minElo: 2200 },
  { rank: 'legend',     minElo: 2000 },
  { rank: 'master',     minElo: 1800 },
  { rank: 'pro',        minElo: 1600 },
  { rank: 'elite',      minElo: 1400 },
  { rank: 'challenger', minElo: 1200 },
  { rank: 'storm',      minElo: 1000 },
  { rank: 'rookie',     minElo: 0 },
];

export function getRankFromElo(elo) {
  for (const range of RANK_RANGES) {
    if (elo >= range.minElo) {
      const tier = RANK_TIERS[range.rank];
      return {
        rank: range.rank,
        display: tier.name,
        tier,
      };
    }
  }

  return { rank: 'rookie', display: 'Rookie', tier: RANK_TIERS.rookie };
}

export function getNextThreshold(elo) {
  for (let i = 0; i < RANK_RANGES.length; i++) {
    const range = RANK_RANGES[i];
    if (elo >= range.minElo) {
      if (i === 0) return { target: null, label: null }; // God Blader is max
      const nextRange = RANK_RANGES[i - 1];
      return { target: nextRange.minElo, label: RANK_TIERS[nextRange.rank].name };
    }
  }
  return { target: 1000, label: 'Storm Blader' };
}

export function RankBadge({
  elo,
  size = 'md',
  showName = true,
  showElo = false,
  showDivision = true,
  className = ''
}) {
  const { display, tier, rank } = getRankFromElo(elo);
  const Icon = tier.icon;
  const isUnranked = rank === 'unranked';

  const sizes = {
    xs: { iconBox: 20, icon: 10, text: 'text-[8px]',  elo: 'text-[7px]' },
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
          {showElo && (
            <div className={`${s.elo} text-white/60 font-bold tabular-nums`}>
              {elo} ELO
            </div>
          )}
        </div>
      )}
    </div>
  );
}

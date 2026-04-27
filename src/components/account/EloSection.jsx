import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { RankBadge, getRankFromElo, getNextThreshold } from '../RankBadge';

export function EloSection({ profile }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      supabase
        .from('user_elo_history')
        .select('elo_after, delta, created_at, reason')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          setHistory(data ?? []);
          setLoading(false);
        });
    }
  }, [profile?.id]);

  const isPlacement = !profile.placement_done;
  const placementProgress = Math.min(profile.elo_matches || 0, 5);

  const { rank, display, tier } = getRankFromElo(profile.elo, profile.placement_done);
  const isUnranked = rank === 'unranked';
  const isGrandmaster = rank === 'grandmaster';

  // Progress to next division/rank
  const { target: nextTarget, label: nextLabel } = getNextThreshold(profile.elo, profile.placement_done);

  // Compute progress % within current division toward next
  let progressPct = 0;
  if (nextTarget && !isUnranked) {
    // Current division spans 67 ELO
    const divFloor = nextTarget - 67;
    progressPct = ((profile.elo - divFloor) / (nextTarget - divFloor)) * 100;
    progressPct = Math.max(5, Math.min(100, progressPct));
  }

  // Last 5 matches trend
  const last5 = history.slice(0, 5);
  const trend = last5.reduce((a, h) => a + h.delta, 0);

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[3px] h-3.5 bg-primary" />
        <div className="text-[11px] font-extrabold text-white tracking-[0.15em] uppercase">
          Ranking Competitivo
        </div>
      </div>

      <motion.div
        className="rounded-2xl overflow-hidden border bg-slate-900/40 backdrop-blur-xl transition-all duration-500"
        style={{
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

              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between text-[10px] font-black tracking-[0.1em] mb-2 uppercase">
                  <span className="text-yellow-500 flex items-center gap-1.5">
                    <Info size={12} /> Placement Match
                  </span>
                  <span className="text-white tabular-nums">{placementProgress} / 5</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(placementProgress / 5) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <p className="text-[9px] text-white/40 mt-3 leading-tight font-medium">
                  Completa {5 - placementProgress} match ufficiali per sbloccare il tuo primo Rank.
                </p>
              </div>
            </>
          )}

          {/* ─── RANKED STATE ─── */}
          {!isPlacement && (
            <>
              <div className="flex items-center justify-between mb-6">
                <RankBadge
                  elo={profile.elo}
                  placementDone={true}
                  size="lg"
                  showName
                  showElo
                  showDivision
                />

                <div className="text-right">
                  <div className="text-[10px] text-white/50 font-black tracking-wider uppercase">
                    Peak ELO
                  </div>
                  <div className="text-white font-black text-xl tabular-nums">
                    {profile.elo_peak}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {nextTarget && nextLabel ? (
                <div>
                  <div className="flex justify-between text-[10px] font-black tracking-[0.1em] mb-2 uppercase">
                    <span className="text-white/50">Progresso verso {nextLabel}</span>
                    <span className="text-white tabular-nums">
                      {profile.elo} / {nextTarget}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                      style={{ background: tier.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ) : isGrandmaster ? (
                <div className="text-center py-2 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="text-[10px] font-black text-primary tracking-[0.15em] uppercase">
                    ⭐ Massimo Rank Raggiunto
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Trend stats - Shared */}
          {!loading && history.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/5">
              <div>
                <div className="text-[9px] text-white/40 font-black tracking-wider mb-1.5 uppercase">
                  Trend (Ultime 5)
                </div>
                <div className="flex items-center gap-1.5">
                  {trend > 0 ? <TrendingUp size={16} className="text-green-400" /> :
                   trend < 0 ? <TrendingDown size={16} className="text-red-400" /> :
                   <Minus size={16} className="text-white/40" />}
                  <span className={`font-black text-xl tabular-nums ${
                    trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-white/60'
                  }`}>
                    {trend > 0 ? '+' : ''}{trend}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[9px] text-white/40 font-black tracking-wider mb-1.5 uppercase">
                  Match Ufficiali
                </div>
                <div className="text-white font-black text-xl tabular-nums">
                  {profile.elo_matches || 0}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

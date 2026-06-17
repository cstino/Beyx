import React, { useState, useEffect } from 'react';
import { Shield, Target, Zap, Clock, Star, X, Trophy, Swords, Skull, TrendingUp, RotateCcw, Flame } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const BAR_COLORS = {
  extreme: { hex: '#F5A623', glow: '#FFD166' },
  ko: { hex: '#4361EE', glow: '#8194FF' },
  burst: { hex: '#E94560', glow: '#FF6B81' },
  spin: { hex: '#00D68F', glow: '#3DFFBF' },
};

const BAR_ICONS = {
  extreme: Flame,
  ko: Target,
  burst: Zap,
  spin: RotateCcw,
};

function CometBar({ label, count, max, color, glowColor }) {
  const Icon = BAR_ICONS[label.toLowerCase()] || Flame;
  const pct = max > 0 ? (count / max) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <Icon size={12} style={{ color }} className="shrink-0" />
      <span className="text-[8px] font-black text-white/50 uppercase w-10 shrink-0">{label}</span>
      <div className="flex-1 relative h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right, ${color}cc, ${glowColor})`,
            boxShadow: `0 0 6px ${glowColor}66`,
          }}
        />
      </div>
      <span className="text-[9px] font-black text-white/60 tabular-nums w-4 text-right">{count}</span>
    </div>
  );
}

function MiniStatCard({ label, value, color, icon: Icon }) {
  return (
    <div 
      className="rounded-2xl bg-white/5 border border-white/10 p-2.5 flex flex-col items-center justify-center gap-0.5 text-center"
      style={{ borderTopColor: color, borderTopWidth: 2 }}
    >
      <Icon size={14} style={{ color }} />
      <span className="text-sm font-black text-white font-createfuture leading-none mt-1">{value}</span>
      <span className="text-[7px] font-black text-white/30 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function StatsModal({ isOpen, onClose, blade, actionLabel, onAction, actionDisabled }) {
  const [matchStats, setMatchStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && blade) {
      setLoading(true);
      supabase.rpc('combo_points_leaderboard', { p_min_battles: 0 })
        .then(({ data, error }) => {
          if (data && !error) {
            const found = data.find(c => c.blade_name === blade.name);
            setMatchStats(found || {
              wins: 0,
              losses: 0,
              draws: 0,
              total_rounds: 0,
              win_rate: 0,
              points: 0,
              extreme_wins: 0,
              ko_wins: 0,
              burst_wins: 0,
              spin_wins: 0,
              extreme_losses: 0,
              ko_losses: 0,
              burst_losses: 0,
              spin_losses: 0
            });
          } else {
            console.error("Error loading match stats:", error);
          }
          setLoading(false);
        });
    }
  }, [isOpen, blade]);

  if (!isOpen || !blade) return null;

  const getGlowColor = (type) => {
    const t = type?.toLowerCase();
    if (t === 'attack' || t === 'att') return '#ef4444';
    if (t === 'defense' || t === 'def') return '#3b82f6';
    return '#22c55e'; // stamina / balance
  };

  const glowColor = getGlowColor(blade.type);

  const winBreakdown = matchStats ? [
    { key: 'extreme', label: 'Xtreme', count: matchStats.extreme_wins || 0 },
    { key: 'ko', label: 'KO', count: matchStats.ko_wins || 0 },
    { key: 'burst', label: 'Burst', count: matchStats.burst_wins || 0 },
    { key: 'spin', label: 'Spin', count: matchStats.spin_wins || 0 },
  ] : [];

  const lossBreakdown = matchStats ? [
    { key: 'extreme', label: 'Xtreme', count: matchStats.extreme_losses || 0 },
    { key: 'ko', label: 'KO', count: matchStats.ko_losses || 0 },
    { key: 'burst', label: 'Burst', count: matchStats.burst_losses || 0 },
    { key: 'spin', label: 'Spin', count: matchStats.spin_losses || 0 },
  ] : [];

  const maxWinCount = winBreakdown.length > 0 ? Math.max(...winBreakdown.map(w => w.count), 1) : 1;
  const maxLossCount = lossBreakdown.length > 0 ? Math.max(...lossBreakdown.map(l => l.count), 1) : 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-gradient-to-b from-[#121225] to-[#0d0d1a] border-2 rounded-[36px] overflow-hidden shadow-2xl transition-all duration-300 max-h-[90vh] flex flex-col"
        style={{ borderColor: glowColor, boxShadow: `0 0 40px ${glowColor}33` }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-90 transition-all z-20"
        >
          <X size={20} />
        </button>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-8">
          {/* Header with Type & Rank */}
          <div className="flex justify-between items-center mb-4">
            <span 
              className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white shadow-sm"
              style={{ backgroundColor: glowColor }}
            >
              {blade.type || 'Combo'}
            </span>
            {blade.topRank && (
              <span className="text-xs font-black text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/20 px-3 py-1 rounded-full uppercase tracking-wider">
                Rank: {blade.topRank}°
              </span>
            )}
          </div>

          {/* Large Floating Beyblade Image */}
          <div className="relative w-48 h-48 mx-auto mb-4 flex items-center justify-center">
            <div 
              className="absolute inset-0 blur-[45px] rounded-full opacity-40 animate-pulse"
              style={{ backgroundColor: glowColor }}
            ></div>
            <img 
              src={blade.image_url} 
              alt={blade.name} 
              className="w-40 h-40 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-[float_3s_ease-in-out_infinite]"
              draggable={false}
            />
          </div>

          {/* Title & Code */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black italic uppercase text-white tracking-tight leading-tight">
              {blade.name}
            </h2>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">
              {blade.release_code || 'Speciale'}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: glowColor, borderTopColor: 'transparent' }} />
            </div>
          ) : matchStats.total_rounds === 0 ? (
            <div className="bg-white/5 rounded-3xl border border-white/5 p-6 text-center mb-6">
              <Swords size={24} className="mx-auto text-white/20 mb-2" />
              <div className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-normal">
                Nessun match disputato
              </div>
              <div className="text-[8px] text-white/20 uppercase tracking-wider mt-1">
                I dati dei match e tornei verranno mostrati qui
              </div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                <MiniStatCard label="Punti" value={matchStats.points || 0} color="#9b59b6" icon={Trophy} />
                <MiniStatCard label="Vittorie" value={matchStats.wins || 0} color="#22c55e" icon={Swords} />
                <MiniStatCard label="Sconfitte" value={matchStats.losses || 0} color="#ef4444" icon={Skull} />
                <MiniStatCard label="Win Rate" value={`${matchStats.win_rate || 0}%`} color="#3b82f6" icon={TrendingUp} />
              </div>

              {/* Victory Breakdown */}
              <div className="bg-white/5 rounded-3xl border border-white/5 p-4 mb-4">
                <h3 className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 font-createfuture">
                  Analisi Vittorie ({matchStats.wins})
                </h3>
                <div className="space-y-2.5">
                  {winBreakdown.map((w) => (
                    <CometBar
                      key={w.key}
                      label={w.label}
                      count={w.count}
                      max={maxWinCount}
                      color={BAR_COLORS[w.key].hex}
                      glowColor={BAR_COLORS[w.key].glow}
                    />
                  ))}
                </div>
              </div>

              {/* Loss Breakdown */}
              <div className="bg-white/5 rounded-3xl border border-white/5 p-4 mb-6">
                <h3 className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 font-createfuture">
                  Analisi Sconfitte ({matchStats.losses})
                </h3>
                <div className="space-y-2.5">
                  {lossBreakdown.map((l) => (
                    <CometBar
                      key={l.key}
                      label={l.label}
                      count={l.count}
                      max={maxLossCount}
                      color={BAR_COLORS[l.key].hex}
                      glowColor={BAR_COLORS[l.key].glow}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Additional Config Details */}
          {(blade.weight || blade.stock_ratchet || blade.stock_bit) && (
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5 bg-black/20 rounded-2xl p-3 text-center">
              <div>
                <div className="text-[8px] font-black text-white/30 uppercase tracking-wider mb-0.5">Peso</div>
                <div className="text-xs font-black text-white">{blade.weight ? `${blade.weight}g` : '-'}</div>
              </div>
              <div>
                <div className="text-[8px] font-black text-white/30 uppercase tracking-wider mb-0.5">Stock Ratchet</div>
                <div className="text-[9px] font-black text-white truncate max-w-full" title={blade.stock_ratchet}>{blade.stock_ratchet || '-'}</div>
              </div>
              <div>
                <div className="text-[8px] font-black text-white/30 uppercase tracking-wider mb-0.5">Stock Bit</div>
                <div className="text-[9px] font-black text-white truncate max-w-full" title={blade.stock_bit}>{blade.stock_bit || '-'}</div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {actionLabel && onAction && (
            <button
              onClick={() => {
                onAction();
                onClose();
              }}
              disabled={actionDisabled}
              className="w-full mt-6 py-4 bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white font-black uppercase text-xs tracking-[0.15em] rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 border border-white/10"
              style={{ 
                backgroundColor: actionDisabled ? undefined : glowColor, 
                boxShadow: actionDisabled ? undefined : `0 0 20px ${glowColor}55` 
              }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

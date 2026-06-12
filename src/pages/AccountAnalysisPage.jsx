import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  TrendingUp, 
  Zap, 
  Target, 
  Flame, 
  RotateCcw, 
  Swords, 
  Award, 
  BarChart2, 
  Compass, 
  Shield, 
  History 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { PageContainer } from '../components/PageContainer';
import { Avatar } from '../components/Avatar';

const BLADE_TYPES = ['Attack', 'Defense', 'Stamina', 'Balance'];

const FINISH_CONFIGS = {
  burst: { name: 'Burst Finish', color: '#E94560', icon: Zap },
  ko: { name: 'KO Finish', color: '#4361EE', icon: Target },
  xtreme: { name: 'Xtreme Finish', color: '#F5A623', icon: Flame },
  spin_finish: { name: 'Spin Finish', color: '#00D68F', icon: RotateCcw }
};

export default function AccountAnalysisPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('used'); // 'used' | 'wins' | 'losses'
  
  // Aggregated data state
  const [data, setData] = useState({
    bladeStats: [],
    finishesWon: { burst: 0, ko: 0, xtreme: 0, spin_finish: 0 },
    finishesLost: { burst: 0, ko: 0, xtreme: 0, spin_finish: 0 },
    typeStats: {},
    pointsStats: { scored: 0, conceded: 0, totalRounds: 0 },
    eloHistory: [],
    overallStats: { wins: 0, losses: 0, draws: 0, total: 0 }
  });

  useEffect(() => {
    if (user) {
      loadDetailedAnalysis();
    }
  }, [user]);

  async function loadDetailedAnalysis() {
    setLoading(true);
    try {
      // 1. Fetch all rounds
      const [roundsRes, bladesRes, eloHistoryRes] = await Promise.all([
        supabase
          .from('rounds')
          .select(`
            id,
            winner_side,
            finish_type,
            points_awarded,
            p1_blade_id,
            p2_blade_id,
            battle_id,
            battles (
              player1_user_id,
              player2_user_id,
              is_official
            )
          `),
        supabase.from('blades').select('*'),
        supabase
          .from('user_elo_history')
          .select('created_at, elo, delta, battle_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (roundsRes.error) throw roundsRes.error;
      if (bladesRes.error) throw bladesRes.error;

      const allRounds = roundsRes.data || [];
      const blades = bladesRes.data || [];
      const eloHistory = eloHistoryRes.data || [];

      // Create a blade map for fast lookup
      const bladeMap = {};
      blades.forEach(b => {
        // Resolve variant index image if active
        let imageUrl = b.image_url;
        if (b.active_variant_index != null && Array.isArray(b.variants) && b.variants[b.active_variant_index]?.image_url) {
          imageUrl = b.variants[b.active_variant_index].image_url;
        }
        bladeMap[b.id] = { ...b, resolved_image_url: imageUrl };
      });

      // Filter rounds related to current user
      const userRounds = allRounds.filter(r => {
        return r.battles && (r.battles.player1_user_id === user.id || r.battles.player2_user_id === user.id);
      });

      // Initialize aggregation objects
      const bladeStatsAcc = {};
      const finishesWon = { burst: 0, ko: 0, xtreme: 0, spin_finish: 0 };
      const finishesLost = { burst: 0, ko: 0, xtreme: 0, spin_finish: 0 };
      const typeStats = {
        Attack: { wins: 0, total: 0 },
        Defense: { wins: 0, total: 0 },
        Stamina: { wins: 0, total: 0 },
        Balance: { wins: 0, total: 0 }
      };
      let scored = 0;
      let conceded = 0;
      let winCount = 0;
      let lossCount = 0;
      let drawCount = 0;

      userRounds.forEach(r => {
        const isP1 = r.battles.player1_user_id === user.id;
        const userBladeId = isP1 ? r.p1_blade_id : r.p2_blade_id;
        const winnerSide = r.winner_side;
        if (!winnerSide) return;

        let outcome = 'draw';
        if (winnerSide === 'p1') outcome = isP1 ? 'win' : 'loss';
        else if (winnerSide === 'p2') outcome = isP1 ? 'loss' : 'win';

        if (outcome === 'win') winCount++;
        else if (outcome === 'loss') lossCount++;
        else drawCount++;

        if (userBladeId) {
          if (!bladeStatsAcc[userBladeId]) {
            const bladeInfo = bladeMap[userBladeId] || { name: 'Unknown Blade', type: 'Attack', resolved_image_url: '' };
            bladeStatsAcc[userBladeId] = {
              id: userBladeId,
              name: bladeInfo.name,
              type: bladeInfo.type,
              image_url: bladeInfo.resolved_image_url,
              wins: 0,
              losses: 0,
              draws: 0,
              total: 0
            };
          }
          const bs = bladeStatsAcc[userBladeId];
          bs.total++;
          if (outcome === 'win') bs.wins++;
          else if (outcome === 'loss') bs.losses++;
          else bs.draws++;

          // Type stats
          const bType = bladeMap[userBladeId]?.type;
          if (bType && typeStats[bType]) {
            typeStats[bType].total++;
            if (outcome === 'win') typeStats[bType].wins++;
          }
        }

        // Finishes and points
        const fType = r.finish_type === 'spin' ? 'spin_finish' : r.finish_type;
        if (outcome === 'win') {
          scored += r.points_awarded || 0;
          if (fType && finishesWon[fType] !== undefined) {
            finishesWon[fType]++;
          }
        } else if (outcome === 'loss') {
          conceded += r.points_awarded || 0;
          if (fType && finishesLost[fType] !== undefined) {
            finishesLost[fType]++;
          }
        }
      });

      // Sort blade stats into an array
      const bladeStatsArray = Object.values(bladeStatsAcc);

      setData({
        bladeStats: bladeStatsArray,
        finishesWon,
        finishesLost,
        typeStats,
        pointsStats: {
          scored,
          conceded,
          totalRounds: userRounds.length
        },
        eloHistory,
        overallStats: {
          wins: winCount,
          losses: lossCount,
          draws: drawCount,
          total: userRounds.length
        }
      });
    } catch (err) {
      console.error('Error loading account analysis:', err);
    } finally {
      setLoading(false);
    }
  }

  // Get sorted blades list depending on active tab
  const getSortedBlades = () => {
    const list = [...data.bladeStats];
    if (activeTab === 'used') {
      return list.sort((a, b) => b.total - a.total);
    } else if (activeTab === 'wins') {
      return list.sort((a, b) => b.wins - a.wins || b.total - a.total);
    } else {
      return list.sort((a, b) => b.losses - a.losses || b.total - a.total);
    }
  };

  // Helper calculation for win rates
  const getWinRate = (wins, total) => {
    if (!total) return 0;
    return Math.round((wins * 100) / total);
  };

  // Find user playstyle dominant type
  const getPlaystyleInsight = () => {
    let maxTotal = -1;
    let dominantType = 'Nessuno';
    let bestWinRate = -1;
    let bestType = 'Nessuno';

    Object.entries(data.typeStats).forEach(([type, stats]) => {
      if (stats.total > maxTotal) {
        maxTotal = stats.total;
        dominantType = type;
      }
      const wr = getWinRate(stats.wins, stats.total);
      if (stats.total >= 3 && wr > bestWinRate) {
        bestWinRate = wr;
        bestType = type;
      }
    });

    if (maxTotal === 0) {
      return "Gioca qualche scontro per scoprire il tuo stile dominante!";
    }

    if (dominantType === bestType && bestWinRate >= 60) {
      return `Il tuo stile preferito è ${dominantType} ed è incredibilmente efficace con il ${bestWinRate}% di vittorie! Continua così.`;
    } else if (bestWinRate >= 65) {
      return `Sebbene utilizzi spesso tipologie diverse, con i Blade di tipo ${bestType} hai una precisione letale (${bestWinRate}% di vittorie). Prova ad usarli di più!`;
    } else {
      return `Prediligi i Blade di tipo ${dominantType} (${maxTotal} round disputati). Ottimizza le combinazioni di Ratchet e Bit per elevare il rendimento!`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Aggregazione dati...</p>
      </div>
    );
  }

  const sortedBlades = getSortedBlades();
  const totalFinishesWon = Object.values(data.finishesWon).reduce((a, b) => a + b, 0);
  const totalFinishesLost = Object.values(data.finishesLost).reduce((a, b) => a + b, 0);

  return (
    <PageContainer className="pt-6">
      {/* Header */}
      <div className="px-6 mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/account')}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="text-right">
          <div className="text-[9px] font-black tracking-[0.2em] text-[#9b59b6] font-createfuture uppercase">
            Analisi Strategica
          </div>
          <h1 className="text-white text-md font-black uppercase italic tracking-tight font-createfuture">
            Rendimento Avanzato
          </h1>
        </div>
      </div>

      <div className="px-6 space-y-8 pb-24">
        {/* Overview cards - Points Breakdown */}
        <section className="bg-[#12122A] rounded-3xl p-5 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
          <h2 className="text-[10px] font-black text-white/40 tracking-[0.15em] uppercase mb-4 font-createfuture">Bilancio Punti Round</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="text-[9px] font-black text-white/30 tracking-widest uppercase">Punti Segnati</div>
              <div className="text-3xl font-black text-[#00D68F] font-createfuture mt-1 tabular-nums">{data.pointsStats.scored}</div>
              <div className="text-[8px] text-white/20 mt-1 font-semibold">Guadagnati dai round vinti</div>
            </div>
            
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="text-[9px] font-black text-white/30 tracking-widest uppercase">Punti Subiti</div>
              <div className="text-3xl font-black text-[#E94560] font-createfuture mt-1 tabular-nums">{data.pointsStats.conceded}</div>
              <div className="text-[8px] text-white/20 mt-1 font-semibold">Concessi nei round persi</div>
            </div>
          </div>

          {/* Scored Ratio Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-wider mb-2">
              <span className="text-[#00D68F]">Efficacia Attacco</span>
              <span className="text-white/40">
                {data.pointsStats.scored + data.pointsStats.conceded > 0 
                  ? Math.round((data.pointsStats.scored * 100) / (data.pointsStats.scored + data.pointsStats.conceded))
                  : 0}%
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5 flex">
              {data.pointsStats.scored + data.pointsStats.conceded > 0 ? (
                <>
                  <div 
                    className="h-full rounded-l-full bg-[#00D68F]" 
                    style={{ width: `${(data.pointsStats.scored * 100) / (data.pointsStats.scored + data.pointsStats.conceded)}%` }} 
                  />
                  <div 
                    className="h-full rounded-r-full bg-[#E94560]" 
                    style={{ width: `${(data.pointsStats.conceded * 100) / (data.pointsStats.scored + data.pointsStats.conceded)}%` }} 
                  />
                </>
              ) : (
                <div className="h-full w-full bg-white/10 rounded-full" />
              )}
            </div>
            <div className="flex justify-between text-[8px] text-white/20 mt-1.5 font-bold uppercase tracking-wider">
              <span>Media: {data.pointsStats.totalRounds > 0 ? (data.pointsStats.scored / data.pointsStats.totalRounds).toFixed(1) : 0} punti/round</span>
              <span>Rapporto Vittoria: {data.overallStats.wins}V - {data.overallStats.losses}L</span>
            </div>
          </div>
        </section>

        {/* Playstyle Performance */}
        <section className="bg-[#12122A] rounded-3xl p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Compass size={14} className="text-[#9b59b6]" />
            <h2 className="text-[10px] font-black text-white/40 tracking-[0.15em] uppercase font-createfuture">Analisi Stile di Gioco</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {BLADE_TYPES.map(type => {
              const stats = data.typeStats[type] || { wins: 0, total: 0 };
              const wr = getWinRate(stats.wins, stats.total);
              
              return (
                <div 
                  key={type} 
                  className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">{type}</span>
                    <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded uppercase
                      ${type === 'Attack' ? 'bg-red-500/10 text-red-400' : 
                        type === 'Defense' ? 'bg-blue-500/10 text-blue-400' : 
                        type === 'Stamina' ? 'bg-green-500/10 text-green-400' : 
                        'bg-yellow-500/10 text-yellow-400'}`}
                    >
                      {stats.total} R
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-xl font-black text-white font-createfuture">{wr}%</span>
                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">WR</span>
                  </div>

                  {/* Tiny progress bar */}
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className={`h-full rounded-full 
                        ${type === 'Attack' ? 'bg-red-500' : 
                          type === 'Defense' ? 'bg-blue-500' : 
                          type === 'Stamina' ? 'bg-green-500' : 
                          'bg-yellow-500'}`}
                      style={{ width: `${wr}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-[#9b59b6]/5 border border-[#9b59b6]/10 text-white/60 text-[9px] font-bold tracking-wider leading-relaxed">
            <span className="text-[#9b59b6] font-black uppercase tracking-widest block mb-1">🔍 INSIGHT STRATEGICO</span>
            {getPlaystyleInsight()}
          </div>
        </section>

        {/* Beyblades statistics with tabs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Swords size={14} className="text-primary" />
              <h2 className="text-[10px] font-black text-white/40 tracking-[0.15em] uppercase font-createfuture">Prestazione Beyblade</h2>
            </div>
          </div>

          {/* Sub tabs */}
          <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl mb-3">
            {[
              { id: 'used', label: 'Più Usati' },
              { id: 'wins', label: 'Più Vincenti' },
              { id: 'losses', label: 'Più Perdenti' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-center rounded-lg text-[9px] font-extrabold tracking-wider transition-all font-createfuture uppercase
                  ${activeTab === tab.id ? 'bg-primary/20 border border-primary/30 text-primary' : 'text-white/40 hover:text-white/60'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Blades List */}
          <div className="space-y-2">
            {sortedBlades.length === 0 ? (
              <div className="text-center py-10 bg-[#12122A] rounded-2xl border border-white/5 text-white/20 text-[9px] font-black tracking-widest uppercase">
                Nessun blade registrato nei tuoi match
              </div>
            ) : (
              sortedBlades.slice(0, 5).map((blade, idx) => {
                const wr = getWinRate(blade.wins, blade.total);
                
                return (
                  <div 
                    key={blade.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#12122A] border border-white/5"
                  >
                    <div className="w-5 text-center font-black text-white/20 text-[10px] font-createfuture">
                      #{idx + 1}
                    </div>

                    {/* Blade Image */}
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center p-1 shrink-0">
                      {blade.image_url ? (
                        <img src={blade.image_url} alt={blade.name} className="w-full h-full object-contain drop-shadow" />
                      ) : (
                        <Swords size={16} className="text-white/20" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold text-[11px] truncate uppercase font-createfuture italic">{blade.name}</span>
                        <span className={`text-[6px] font-black px-1 py-0.2 rounded uppercase
                          ${blade.type === 'Attack' ? 'bg-red-500/10 text-red-400' : 
                            blade.type === 'Defense' ? 'bg-blue-500/10 text-blue-400' : 
                            blade.type === 'Stamina' ? 'bg-green-500/10 text-green-400' : 
                            'bg-yellow-500/10 text-yellow-400'}`}
                        >
                          {blade.type}
                        </span>
                      </div>
                      <div className="text-white/30 text-[8px] uppercase tracking-wider font-extrabold mt-0.5">
                        {blade.wins}V / {blade.losses}L / {blade.draws}D · {blade.total} Round
                      </div>
                    </div>

                    {/* Win rate indicator */}
                    <div className="text-right shrink-0">
                      <div className="text-white font-black font-createfuture text-xs tabular-nums">{wr}%</div>
                      <div className="text-[7px] text-white/30 font-bold uppercase tracking-widest">Win Rate</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Outcome Breakdown Comparison */}
        <section className="bg-[#12122A] rounded-3xl p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="text-[#00D68F]" />
            <h2 className="text-[10px] font-black text-white/40 tracking-[0.15em] uppercase font-createfuture">Dettaglio Finish</h2>
          </div>

          <div className="space-y-6">
            {/* Wins Breakdown */}
            <div>
              <h3 className="text-[9px] font-black text-[#00D68F] uppercase tracking-widest mb-3">Come Vinci ({totalFinishesWon} Finish)</h3>
              <div className="space-y-2.5">
                {Object.entries(FINISH_CONFIGS).map(([key, config]) => {
                  const count = data.finishesWon[key] || 0;
                  const pct = totalFinishesWon > 0 ? Math.round((count * 100) / totalFinishesWon) : 0;
                  const Icon = config.icon;

                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center text-[8px] font-extrabold uppercase tracking-wider text-white/60 mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon size={10} style={{ color: config.color }} />
                          <span>{config.name}</span>
                        </div>
                        <span className="tabular-nums">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: config.color, width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Losses Breakdown */}
            <div>
              <h3 className="text-[9px] font-black text-[#E94560] uppercase tracking-widest mb-3">Come Perdi ({totalFinishesLost} Finish)</h3>
              <div className="space-y-2.5">
                {Object.entries(FINISH_CONFIGS).map(([key, config]) => {
                  const count = data.finishesLost[key] || 0;
                  const pct = totalFinishesLost > 0 ? Math.round((count * 100) / totalFinishesLost) : 0;
                  const Icon = config.icon;

                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center text-[8px] font-extrabold uppercase tracking-wider text-white/60 mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon size={10} style={{ color: config.color }} />
                          <span>{config.name} subita</span>
                        </div>
                        <span className="tabular-nums">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: config.color, width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ELO history section */}
        <section className="bg-[#12122A] rounded-3xl p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <History size={14} className="text-[#F5A623]" />
            <h2 className="text-[10px] font-black text-white/40 tracking-[0.15em] uppercase font-createfuture">Storico Variazioni ELO</h2>
          </div>

          <div className="space-y-2.5">
            {data.eloHistory.length === 0 ? (
              <div className="text-center py-6 text-white/20 text-[9px] font-black tracking-widest uppercase">
                Nessuna variazione ELO registrata
              </div>
            ) : (
              data.eloHistory.map((h, idx) => {
                const date = new Date(h.created_at).toLocaleDateString();
                const sign = h.delta >= 0 ? '+' : '';
                const deltaColor = h.delta > 0 ? 'text-[#00D68F] bg-[#00D68F]/10 border-[#00D68F]/20' : 
                                   h.delta < 0 ? 'text-[#E94560] bg-[#E94560]/10 border-[#E94560]/20' : 
                                   'text-white/40 bg-white/5 border-white/10';

                return (
                  <div 
                    key={idx}
                    className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-[10px] font-black text-white font-createfuture italic">
                        {h.elo} ELO
                      </div>
                      <div className="text-[7px] text-white/20 mt-0.5 font-bold uppercase tracking-wider">
                        Registrato il {date}
                      </div>
                    </div>

                    <span className={`text-[10px] font-black font-createfuture border px-2.5 py-0.5 rounded-lg ${deltaColor}`}>
                      {sign}{h.delta}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

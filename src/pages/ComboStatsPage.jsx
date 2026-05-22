import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Zap, Target, Flame, RotateCcw, Shield, Sword, Wind } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PageContainer } from '../components/PageContainer';
import { useUIStore } from '../store/useUIStore';

export default function ComboStatsPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { setHeader, clearHeader } = useUIStore();
  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);

  const decodedName = decodeURIComponent(name || '');

  useEffect(() => {
    setHeader('DETTAGLIO COMBO', '/combo-leaderboard');
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  useEffect(() => {
    loadCombo();
  }, [decodedName]);

  async function loadCombo() {
    setLoading(true);
    const { data } = await supabase.rpc('combo_points_leaderboard', { p_min_battles: 0 });
    const found = (data || []).find(c => c.combo_name === decodedName);
    setCombo(found || null);
    setLoading(false);
  }

  if (loading) return (
    <PageContainer>
      <div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-[#9b59b6] border-t-transparent rounded-full animate-spin" /></div>
    </PageContainer>
  );

  if (!combo) return (
    <PageContainer>
      <div className="text-center pt-20">
        <div className="text-white/30 text-sm font-bold uppercase">Combo non trovata</div>
        <button onClick={() => navigate('/combo-leaderboard')} className="mt-4 text-[#9b59b6] text-[10px] font-black uppercase tracking-widest">Torna alla classifica</button>
      </div>
    </PageContainer>
  );

  const typeColor = combo.blade_type === 'Attack' ? '#ef4444' : combo.blade_type === 'Defense' ? '#3b82f6' : combo.blade_type === 'Stamina' ? '#22c55e' : '#eab308';
  const totalWins = combo.wins || 0;
  const totalLosses = combo.losses || 0;
  const totalDraws = combo.draws || 0;
  const totalRounds = combo.total_rounds || 1;

  const winBreakdown = [
    { label: 'Xtreme', count: combo.extreme_wins || 0, color: '#F5A623', icon: Flame },
    { label: 'KO', count: combo.ko_wins || 0, color: '#4361EE', icon: Target },
    { label: 'Burst', count: combo.burst_wins || 0, color: '#E94560', icon: Zap },
    { label: 'Spin', count: combo.spin_wins || 0, color: '#00D68F', icon: RotateCcw },
  ];

  const lossBreakdown = [
    { label: 'Xtreme', count: combo.extreme_losses || 0, color: '#F5A623', icon: Flame },
    { label: 'KO', count: combo.ko_losses || 0, color: '#4361EE', icon: Target },
    { label: 'Burst', count: combo.burst_losses || 0, color: '#E94560', icon: Zap },
    { label: 'Spin', count: combo.spin_losses || 0, color: '#00D68F', icon: RotateCcw },
  ];

  const maxWinCount = Math.max(...winBreakdown.map(w => w.count), 1);
  const maxLossCount = Math.max(...lossBreakdown.map(l => l.count), 1);

  return (
    <PageContainer>
      <div className="px-4 mb-6 pt-4">
        <button onClick={() => navigate('/combo-leaderboard')} className="flex items-center gap-1 text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 hover:text-white/70 transition-colors">
          <ChevronLeft size={14} /> Classifica
        </button>

        {/* Hero Card */}
        <div className="p-6 rounded-[32px] bg-gradient-to-br from-[#1A1A3A] to-[#0A0A1A] border-2 mb-4" style={{ borderColor: typeColor + '33' }}>
          <div className="flex items-center gap-4 mb-4">
            {combo.blade_image_url ? (
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center p-2">
                <img src={combo.blade_image_url} alt="" className="w-full h-full object-contain drop-shadow-lg" />
              </div>
            ) : null}
            <div>
              <h1 className="text-lg font-black text-white uppercase italic font-createfuture">{combo.combo_name}</h1>
              <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase mt-1 inline-block" style={{ backgroundColor: typeColor + '20', color: typeColor }}>
                {combo.blade_type || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-white">{combo.points || 0}</div>
              <div className="text-[8px] font-black text-white/30 uppercase tracking-widest">Punti</div>
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-green-400">{totalWins}</div>
              <div className="text-[8px] font-black text-white/30 uppercase tracking-widest">Vittorie</div>
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-red-400">{totalLosses}</div>
              <div className="text-[8px] font-black text-white/30 uppercase tracking-widest">Sconfitte</div>
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-white/50">{combo.win_rate}%</div>
              <div className="text-[8px] font-black text-white/30 uppercase tracking-widest">Win Rate</div>
            </div>
          </div>
        </div>

        {/* Win Breakdown */}
        <div className="bg-[#12122A] rounded-3xl border border-white/5 p-5 mb-4">
          <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4 font-createfuture">Analisi Vittorie ({totalWins})</h3>
          <div className="space-y-2">
            {winBreakdown.map(w => (
              <div key={w.label} className="flex items-center gap-3">
                <w.icon size={14} style={{ color: w.color }} className="shrink-0" />
                <span className="text-[9px] font-black text-white/60 uppercase w-12 shrink-0">{w.label}</span>
                <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(w.count / maxWinCount) * 100}%`, backgroundColor: w.color }} />
                </div>
                <span className="text-[10px] font-black text-white/40 tabular-nums w-6 text-right">{w.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loss Breakdown */}
        <div className="bg-[#12122A] rounded-3xl border border-white/5 p-5 mb-4">
          <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4 font-createfuture">Analisi Sconfitte ({totalLosses})</h3>
          <div className="space-y-2">
            {lossBreakdown.map(l => (
              <div key={l.label} className="flex items-center gap-3">
                <l.icon size={14} style={{ color: l.color }} className="shrink-0 opacity-60" />
                <span className="text-[9px] font-black text-white/60 uppercase w-12 shrink-0 opacity-60">{l.label}</span>
                <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all opacity-60" style={{ width: `${(l.count / maxLossCount) * 100}%`, backgroundColor: l.color }} />
                </div>
                <span className="text-[10px] font-black text-white/40 tabular-nums w-6 text-right">{l.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-[#12122A] rounded-3xl border border-white/5 p-5">
          <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-3 font-createfuture">Riepilogo</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex justify-between p-2 bg-white/[0.02] rounded-lg">
              <span className="text-white/40">Round Totali</span>
              <span className="text-white font-black">{totalRounds}</span>
            </div>
            <div className="flex justify-between p-2 bg-white/[0.02] rounded-lg">
              <span className="text-white/40">Pareggi</span>
              <span className="text-white font-black">{totalDraws}</span>
            </div>
            <div className="flex justify-between p-2 bg-white/[0.02] rounded-lg">
              <span className="text-white/40">Win Rate</span>
              <span className="text-green-400 font-black">{combo.win_rate}%</span>
            </div>
            <div className="flex justify-between p-2 bg-white/[0.02] rounded-lg">
              <span className="text-white/40">Punteggio</span>
              <span className="text-[#9b59b6] font-black">{combo.points || 0} pts</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

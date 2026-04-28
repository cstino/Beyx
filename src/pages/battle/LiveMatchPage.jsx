import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, Target, Flame, RotateCcw, Minus, Trophy, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { PageContainer } from '../../components/PageContainer';

const FINISH_TYPES = [
  { id: 'burst',       name: 'Burst',   points: 2, icon: Zap,       color: '#E94560' },
  { id: 'ko',          name: 'KO',      points: 2, icon: Target,    color: '#4361EE' },
  { id: 'xtreme',      name: 'Xtreme',  points: 3, icon: Flame,     color: '#F5A623' },
  { id: 'spin_finish', name: 'Spin',    points: 1, icon: RotateCcw, color: '#00D68F' },
  { id: 'draw',        name: 'Draw',    points: 0, icon: Minus,     color: '#6B7280' },
];

export function LiveMatchPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);

  const [battle, setBattle] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [p1Combos, setP1Combos] = useState([]);
  const [p2Combos, setP2Combos] = useState([]);
  const [parts, setParts] = useState({ blades: [], ratchets: [], bits: [] });

  // Current round state
  const [selectedP1Combo, setSelectedP1Combo] = useState(null);
  const [selectedP2Combo, setSelectedP2Combo] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [selectedFinish, setSelectedFinish] = useState(null);

  useEffect(() => {
    loadBattle();

    const channel = supabase
      .channel(`battle-${battleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rounds',
        filter: `battle_id=eq.${battleId}`,
      }, () => loadRounds())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'battles',
        filter: `id=eq.${battleId}`,
      }, () => loadBattle())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [battleId]);

  async function loadBattle() {
    const { data } = await supabase.from('battles')
      .select(`*,
        p1:player1_user_id(username, avatar_id),
        p2:player2_user_id(username, avatar_id)
      `)
      .eq('id', battleId)
      .single();

    if (data) {
      setBattle(data);
      
      // Fetch parts to resolve names from configs
      const [b, r, t] = await Promise.all([
        supabase.from('blades').select('*'),
        supabase.from('ratchets').select('*'),
        supabase.from('bits').select('*')
      ]);
      const partsData = { blades: b.data || [], ratchets: r.data || [], bits: t.data || [] };
      setParts(partsData);

      // Load combos from config
      if (data.p1_deck_config?.beys) {
        setP1Combos(data.p1_deck_config.beys.map((b, i) => ({ id: `p1-${i}`, ...b })));
      }
      if (data.p2_deck_config?.beys) {
        setP2Combos(data.p2_deck_config.beys.map((b, i) => ({ id: `p2-${i}`, ...b })));
      }
      
      loadRounds();
    }
  }

  async function loadRounds() {
    const { data } = await supabase.from('rounds')
      .select('*')
      .eq('battle_id', battleId)
      .order('round_number');
    setRounds(data ?? []);
  }

  const getBeyName = (config) => {
    if (!config) return '—';
    const blade = parts.blades.find(b => b.id === config.blade_id);
    if (!blade) return 'Bey...';
    if (config.is_stock) return blade.name;
    const ratchet = parts.ratchets.find(r => r.id === config.ratchet_id);
    const bit = parts.bits.find(b => b.id === config.bit_id);
    return `${blade.name} ${ratchet?.name || ''} ${bit?.name || ''}`.trim();
  };

  if (!battle) return null;

  const confirmedRounds = rounds.filter(r => r.confirmed_by_p1 && r.confirmed_by_p2);
  const p1Score = confirmedRounds.reduce((s, r) => s + (r.winner_side === 'p1' ? r.points_awarded : 0), 0);
  const p2Score = confirmedRounds.reduce((s, r) => s + (r.winner_side === 'p2' ? r.points_awarded : 0), 0);
  const currentRound = rounds.length + 1;
  const isComplete = battle.status === 'completed';
  const mySide = userId === battle.player1_user_id ? 'p1' : 'p2';

  const p1Name = battle.player1_guest_name ?? battle.p1?.username ?? 'P1';
  const p2Name = battle.player2_guest_name ?? battle.p2?.username ?? 'P2';

  async function submitRound() {
    if (!selectedWinner || !selectedFinish) return;
    const finishData = FINISH_TYPES.find(f => f.id === selectedFinish);

    await supabase.from('rounds').insert({
      battle_id:      battleId,
      round_number:   currentRound,
      p1_combo_label: getBeyName(selectedP1Combo),
      p2_combo_label: getBeyName(selectedP2Combo),
      winner_side:    selectedWinner,
      finish_type:    selectedFinish,
      points_awarded: finishData?.points ?? 0,
      [`confirmed_by_${mySide}`]: true,
    });

    setSelectedP1Combo(null);
    setSelectedP2Combo(null);
    setSelectedWinner(null);
    setSelectedFinish(null);
  }

  async function confirmRound(roundId) {
    await supabase.from('rounds')
      .update({ [`confirmed_by_${mySide}`]: true })
      .eq('id', roundId);
  }

  return (
    <PageContainer>
      <div className="px-4 mb-4 flex items-center gap-3">
        <button onClick={() => navigate('/battle')}
          className="p-2 rounded-xl bg-white/5 text-white/70">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-center">
          <div className="text-[10px] font-bold text-white/40 tracking-[0.15em]">
            {battle.is_official ? '⚔️ UFFICIALE' : 'AMICHEVOLE'} · ROUND {currentRound}
          </div>
          <div className="text-[10px] text-white/30">
            Primo a {battle.point_target} punti
          </div>
        </div>
        <div className="w-10" />
      </div>

      {/* SCOREBOARD */}
      <div className="mx-4 mb-6 rounded-2xl overflow-hidden border border-white/10"
        style={{ background: 'linear-gradient(135deg, #1A1A3A, #0F0F25)' }}>
        <div className="grid grid-cols-3 p-4">
          <div className="text-center">
            <div className="text-[10px] font-bold text-[#E94560] tracking-wider mb-1">{p1Name}</div>
            <motion.div key={p1Score} className="text-5xl font-black text-white tabular-nums"
              initial={{ scale: 1.3 }} animate={{ scale: 1 }}>{p1Score}</motion.div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-white/20 font-black text-xl">VS</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-[#4361EE] tracking-wider mb-1">{p2Name}</div>
            <motion.div key={p2Score} className="text-5xl font-black text-white tabular-nums"
              initial={{ scale: 1.3 }} animate={{ scale: 1 }}>{p2Score}</motion.div>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
            <motion.div className="h-full bg-[#E94560]" animate={{ width: `${(p1Score / battle.point_target) * 50}%` }} />
            <div className="flex-1" />
            <motion.div className="h-full bg-[#4361EE]" animate={{ width: `${(p2Score / battle.point_target) * 50}%` }} />
          </div>
        </div>
      </div>

      {isComplete && (
        <motion.div className="mx-4 mb-6 p-6 rounded-[32px] text-center border-2"
          style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.1), rgba(233,69,96,0.1))', borderColor: '#F5A623' }}
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Trophy size={40} className="text-[#F5A623] mx-auto mb-3 drop-shadow-glow" />
          <div className="text-white text-2xl font-black uppercase italic tracking-tighter mb-1">
            {battle.winner_side === 'p1' ? p1Name : p2Name} VINCE!
          </div>
          <div className="text-white/40 text-[10px] font-black uppercase tracking-widest">
            RISULTATO FINALE: {p1Score} - {p2Score}
          </div>
        </motion.div>
      )}

      {/* Finishing Button */}
      {!isComplete && (p1Score >= battle.point_target || p2Score >= battle.point_target) && (
        <div className="mx-4 mb-6">
           <button 
             onClick={async () => {
                const winner = p1Score >= battle.point_target ? 'p1' : 'p2';
                await supabase.from('battles').update({ 
                  status: 'completed', 
                  winner_side: winner,
                  points_p1: p1Score,
                  points_p2: p2Score 
                }).eq('id', battleId);
             }}
             className="w-full py-4 rounded-2xl bg-[#F5A623] text-white font-black uppercase tracking-widest shadow-glow-accent"
           >
             CONCLUDI MATCH
           </button>
        </div>
      )}

      {!isComplete && (
        <div className="mx-4 mb-6">
          <div className="text-[10px] font-black text-white/50 tracking-[0.2em] mb-3 text-center uppercase">Bey per questo round</div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <ComboSelector label={p1Name} combos={p1Combos} selected={selectedP1Combo} onSelect={setSelectedP1Combo} accentColor="#E94560" getBeyName={getBeyName} />
            <ComboSelector label={p2Name} combos={p2Combos} selected={selectedP2Combo} onSelect={setSelectedP2Combo} accentColor="#4361EE" getBeyName={getBeyName} />
          </div>

          <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3 uppercase text-center">Chi ha vinto questo round?</div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={() => setSelectedWinner('p1')} className={`py-4 rounded-xl border-2 font-bold text-sm transition-all ${selectedWinner === 'p1' ? 'bg-[#E94560] border-[#E94560] text-white' : 'bg-[#12122A] border-white/10 text-white/50'}`}>{p1Name}</button>
            <button onClick={() => { setSelectedWinner('draw'); setSelectedFinish('draw'); }} className={`py-4 rounded-xl border-2 font-bold text-xs transition-all ${selectedWinner === 'draw' ? 'bg-white/20 border-white/40 text-white' : 'bg-[#12122A] border-white/10 text-white/50'}`}>DRAW</button>
            <button onClick={() => setSelectedWinner('p2')} className={`py-4 rounded-xl border-2 font-bold text-sm transition-all ${selectedWinner === 'p2' ? 'bg-[#4361EE] border-[#4361EE] text-white' : 'bg-[#12122A] border-white/10 text-white/50'}`}>{p2Name}</button>
          </div>

          {selectedWinner && selectedWinner !== 'draw' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3 uppercase text-center">Tipo di Finish</div>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {FINISH_TYPES.filter(f => f.id !== 'draw').map(ft => {
                  const Icon = ft.icon;
                  const selected = selectedFinish === ft.id;
                  return (
                    <button key={ft.id} onClick={() => setSelectedFinish(ft.id)} className={`p-3.5 rounded-xl border-2 text-left transition-all ${selected ? '' : 'border-white/10 bg-[#12122A]'}`} style={selected ? { background: `${ft.color}15`, borderColor: ft.color } : undefined}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={16} style={{ color: ft.color }} />
                        <span className="text-white font-bold text-sm">{ft.name}</span>
                      </div>
                      <span className="text-xs font-extrabold" style={{ color: ft.color }}>+{ft.points} PT</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          <motion.button onClick={submitRound} disabled={!selectedWinner || (!selectedFinish && selectedWinner !== 'draw')} whileTap={{ scale: 0.97 }} className="w-full py-4 rounded-xl font-bold tracking-wider text-white disabled:opacity-30 uppercase" style={{ background: 'linear-gradient(135deg, #E94560, #C9304A)', boxShadow: '0 4px 20px -4px rgba(233,69,96,0.5)' }}>
            Conferma Round {currentRound}
          </motion.button>
        </div>
      )}

      {rounds.length > 0 && (
        <div className="mx-4 mb-6">
          <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3 uppercase">Storico Round</div>
          <div className="space-y-1.5">
            {rounds.map(r => {
              const ft = FINISH_TYPES.find(f => f.id === r.finish_type);
              const isConfirmed = r.confirmed_by_p1 && r.confirmed_by_p2;
              const needsMyConfirm = (mySide === 'p1' && !r.confirmed_by_p1) || (mySide === 'p2' && !r.confirmed_by_p2);
              
              return (
                <div key={r.id} className={`flex items-center gap-3 p-4 rounded-[24px] bg-[#12122A] border transition-all ${isConfirmed ? 'border-white/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
                  <div className="text-white/30 font-black text-[10px] w-6 text-center">R{r.round_number}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-white font-black uppercase italic truncate mb-0.5">{r.p1_combo_label ?? '—'} vs {r.p2_combo_label ?? '—'}</div>
                    <div className="flex items-center gap-2">
                       {ft && <div className="text-[8px] font-black uppercase px-2 py-0.5 rounded" style={{ color: ft.color, background: `${ft.color}15` }}>{ft.name}</div>}
                       {!isConfirmed && <div className="text-[8px] font-black text-yellow-500 uppercase tracking-widest animate-pulse">In attesa...</div>}
                    </div>
                  </div>
                  <div className={`text-xl font-black italic ${r.winner_side === 'p1' ? 'text-[#E94560]' : r.winner_side === 'p2' ? 'text-[#4361EE]' : 'text-white/30'}`}>
                    {r.winner_side === 'p1' ? 'P1' : r.winner_side === 'p2' ? 'P2' : '—'}
                  </div>
                  {needsMyConfirm && (
                    <button 
                      onClick={() => confirmRound(r.id)} 
                      className="ml-2 px-4 py-2 rounded-xl bg-yellow-500 text-black text-[10px] font-black uppercase tracking-wider shadow-lg"
                    >
                      CONFERMA
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function ComboSelector({ label, combos, selected, onSelect, accentColor, getBeyName }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div className="text-[9px] font-black tracking-[0.2em] mb-1.5 uppercase opacity-40 text-center" style={{ color: accentColor }}>{label}</div>
      <button onClick={() => setOpen(!open)} className="w-full p-4 rounded-2xl bg-[#12122A] border border-white/10 text-left min-h-[60px] flex items-center justify-center">
        <div className="text-white text-[10px] font-black uppercase italic tracking-tighter text-center">
          {selected ? getBeyName(selected) : 'Scegli Bey'}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="absolute top-full left-0 right-0 z-50 mt-2 p-2 bg-[#1A1A3A] border border-white/10 rounded-2xl shadow-2xl max-h-48 overflow-y-auto" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
            {combos.map(c => (
              <button key={c.id} onClick={() => { onSelect(c); setOpen(false); }} className={`w-full p-3 rounded-xl text-left text-[10px] font-black uppercase italic transition-colors mb-1 last:mb-0 ${selected?.id === c.id ? `bg-opacity-10 border` : 'bg-white/5 hover:bg-white/10'}`} style={selected?.id === c.id ? { background: `${accentColor}10`, borderColor: `${accentColor}40`, color: 'white' } : { color: 'rgba(255,255,255,0.7)' }}>
                {getBeyName(c)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

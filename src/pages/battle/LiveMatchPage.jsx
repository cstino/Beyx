import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, Target, Flame, RotateCcw, Minus, Trophy, ChevronLeft, X, Check, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useToastStore } from '../../store/useToastStore';
import { PageContainer } from '../../components/PageContainer';
import { RankBadge, getRankFromElo, getNextThreshold, RANK_RANGES } from '../../components/RankBadge';
import { Avatar } from '../../components/Avatar';
import { Info, AlertCircle, ChevronRight, Share2, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const setHeader = useUIStore(s => s.setHeader);
  const clearHeader = useUIStore(s => s.clearHeader);

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
  const [eloResult, setEloResult] = useState(null);

  useEffect(() => {
    setHeader('BATTLE ARENA', '/battle');
    return () => clearHeader();
  }, []);

  useEffect(() => {
    loadBattle();

    console.log("Subscribing to realtime for battle:", battleId);
    const channel = supabase
      .channel(`battle-${battleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rounds',
        filter: `battle_id=eq.${battleId}`,
      }, (payload) => {
        console.log("Realtime Round Change:", payload);
        loadRounds();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'battles',
        filter: `id=eq.${battleId}`,
      }, (payload) => {
        console.log("Realtime Battle Update:", payload);
        loadBattle();
      })
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

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
      let finalWinCondition = data.win_condition;
      if (data.tournament_id) {
        const { data: tData } = await supabase.from('tournaments').select('win_condition, structure').eq('id', data.tournament_id).single();
        if (tData) {
          const struct = typeof tData.structure === 'string' ? JSON.parse(tData.structure) : tData.structure;
          finalWinCondition = tData.win_condition || struct?.settings?.winCondition || data.win_condition || 'point_target';
        }
      }
      setBattle({ ...data, win_condition: finalWinCondition });
      
      // Fetch parts to resolve names from configs
      const [b, r, t] = await Promise.all([
        supabase.from('blades').select('*'),
        supabase.from('ratchets').select('*'),
        supabase.from('bits').select('*')
      ]);
      const partsData = { blades: b.data || [], ratchets: r.data || [], bits: t.data || [] };
      setParts(partsData);

      // Load combos from config
      const p1Deck = Array.isArray(data.p1_deck_config) ? data.p1_deck_config : data.p1_deck_config?.beys || [];
      setP1Combos(p1Deck.map((b, i) => ({ ...b, localId: `p1-${i}` })));

      const p2Deck = Array.isArray(data.p2_deck_config) ? data.p2_deck_config : data.p2_deck_config?.beys || [];
      setP2Combos(p2Deck.map((b, i) => ({ ...b, localId: `p2-${i}` })));
      
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
    
    let ratchetName = '';
    let bitName = '';
    
    if (config.is_stock) {
      ratchetName = blade.stock_ratchet || '';
      bitName = blade.stock_bit || '';
    } else {
      ratchetName = parts.ratchets.find(r => r.id === config.ratchet_id)?.name || '';
      bitName = parts.bits.find(b => b.id === config.bit_id)?.name || '';
    }
    
    return `${blade.name} ${ratchetName} ${bitName}`.trim();
  };

  if (!battle) return null;

  const isCreator = userId === battle.created_by || userId === battle.player1_user_id;
  const mySide = userId === battle.player1_user_id ? 'p1' : 'p2';

  // Points are counted immediately now (implied confirmation) unless explicitly contested
  const p1Score = rounds.reduce((s, r) => s + (r.winner_side === 'p1' && r.status !== 'contested' ? r.points_awarded : 0), 0);
  const p2Score = rounds.reduce((s, r) => s + (r.winner_side === 'p2' && r.status !== 'contested' ? r.points_awarded : 0), 0);
  const currentRound = rounds.length + 1;
  const isComplete = battle.status === 'completed';

  const p1Name = battle.player1_guest_name ?? battle.p1?.username ?? 'P1';
  const p2Name = battle.player2_guest_name ?? battle.p2?.username ?? 'P2';

  async function submitRound() {
    if (!selectedWinner || !selectedFinish) return;
    const finishData = FINISH_TYPES.find(f => f.id === selectedFinish);

    const { error } = await supabase.from('rounds').insert({
      battle_id:      battleId,
      round_number:   currentRound,
      p1_combo_label: getBeyName(selectedP1Combo),
      p2_combo_label: getBeyName(selectedP2Combo),
      p1_combo_id:    selectedP1Combo?.id,
      p2_combo_id:    selectedP2Combo?.id,
      p1_blade_id:    selectedP1Combo?.blade_id,
      p2_blade_id:    selectedP2Combo?.blade_id,
      winner_side:    selectedWinner,
      finish_type:    selectedFinish,
      points_awarded: finishData?.points ?? 0,
      [`confirmed_by_${mySide}`]: true,
    });

    if (!error) {
      loadRounds(); // Optimistic load
      setSelectedP1Combo(null);
      setSelectedP2Combo(null);
      setSelectedWinner(null);
      setSelectedFinish(null);
    } else {
      console.error("Error submitting round:", error);
    }
  }

  async function confirmRound(roundId, status = 'confirmed') {
    const { error } = await supabase.from('rounds')
      .update({ 
        [`confirmed_by_${mySide}`]: true,
        status: status 
      })
      .eq('id', roundId);
    
    if (!error) loadRounds();
  }

  async function deleteRound(roundId) {
    if (!isCreator) return;
    const { error } = await supabase.from('rounds').delete().eq('id', roundId);
    if (!error) loadRounds();
  }

  const deckSize = battle.starter_beys_count || (battle.battle_type === '3v3' || battle.format?.includes('3v3') ? 3 : 1);
  const isTargetReached = battle.win_condition === 'total_battle' 
    ? rounds.length >= deckSize 
    : (p1Score >= battle.point_target || p2Score >= battle.point_target);

  async function handleEndMatch() {
    let winnerSide = 'draw';
    if (p1Score > p2Score) winnerSide = 'p1';
    else if (p2Score > p1Score) winnerSide = 'p2';
    
    // 1. Update the battle status if not already completed
    if (battle.status !== 'completed') {
      const { error: battleErr } = await supabase.from('battles').update({ 
        status: 'completed', 
        winner_side: winnerSide,
        points_p1: p1Score,
        points_p2: p2Score,
        played_at: new Date().toISOString()
      }).eq('id', battleId);

      if (battleErr) {
        useToastStore.getState().error("Errore: " + battleErr.message);
        return;
      }
    }

    // 2. If it's a tournament match, update the tournament structure
    if (battle.tournament_id) {
      const { data: tourney } = await supabase.from('tournaments')
        .select('*')
        .eq('id', battle.tournament_id)
        .single();
      
      if (tourney) {
        const structure = typeof tourney.structure === 'string' ? JSON.parse(tourney.structure) : tourney.structure;
        let found = false;
        let rIdx = -1;
        let mIdx = -1;

        // Find the match in the structure
        structure.rounds.forEach((r, ri) => {
          r.matches.forEach((m, mi) => {
            if (m.battle_id === battleId) {
              rIdx = ri;
              mIdx = mi;
              m.winner = winnerSide;
              m.score = { p1: p1Score, p2: p2Score };
              found = true;
            }
          });
        });

        if (found) {
          const winner = winnerSide === 'p1' ? structure.rounds[rIdx].matches[mIdx].p1 : 
                         winnerSide === 'p2' ? structure.rounds[rIdx].matches[mIdx].p2 : null;
          let updatedStatus = tourney.status;
          let winnerUserId = tourney.winner_user_id;
          let winnerGuestName = tourney.winner_guest_name;

          if (tourney.format === 'bracket' && winner) {
            if (rIdx < structure.rounds.length - 1) {
              let currentR = rIdx;
              let currentM = mIdx;
              let currentWinner = winner;

              while (currentR < structure.rounds.length - 1) {
                const nextR = currentR + 1;
                const nextM = Math.floor(currentM / 2);
                
                if (currentM % 2 === 0) structure.rounds[nextR].matches[nextM].p1 = currentWinner;
                else structure.rounds[nextR].matches[nextM].p2 = currentWinner;

                const nextMatch = structure.rounds[nextR].matches[nextM];
                if (nextMatch.p1 && nextMatch.p2 && (nextMatch.p1.isBye || nextMatch.p2.isBye)) {
                  nextMatch.winner = nextMatch.p1.isBye ? 'p2' : 'p1';
                  currentWinner = nextMatch.winner === 'p1' ? nextMatch.p1 : nextMatch.p2;
                  currentR = nextR;
                  currentM = nextM;
                } else break;
              }
            } else {
              updatedStatus = 'completed';
              winnerUserId = winner.user_id;
              winnerGuestName = winner.username;
            }
          }

          // Update tournament in DB
          const { error: tourneyUpdateError } = await supabase.from('tournaments').update({
            structure,
            status: updatedStatus,
            winner_user_id: winnerUserId,
            winner_guest_name: winnerGuestName,
            completed_at: updatedStatus === 'completed' ? new Date().toISOString() : null
          }).eq('id', tourney.id);

          if (tourneyUpdateError) {
            console.error("Error updating tournament:", tourneyUpdateError);
            useToastStore.getState().error("Errore aggiornamento torneo: " + tourneyUpdateError.message);
          }
        }
      }
    }

    useToastStore.getState().success("Match concluso!");
    
    if (battle.is_official) {
      // Fetch ELO changes from history
      setTimeout(async () => {
        const { data: history } = await supabase
          .from('user_elo_history')
          .select('*')
          .eq('battle_id', battleId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (history) {
          setEloResult(history);
          if (history.delta > 0) {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#4361EE', '#E94560', '#F5A623']
            });
          }
        } else {
           navigate(battle.tournament_id ? `/battle/tournament/${battle.tournament_id}` : '/battle');
        }
      }, 1000);
    } else {
      if (battle.tournament_id) {
        navigate(`/battle/tournament/${battle.tournament_id}`);
      } else {
        navigate('/battle');
      }
    }
  }


  if (eloResult) {
    return <EloSummary result={eloResult} battle={battle} onDone={() => navigate('/battle')} />;
  }

  return (
    <PageContainer>
      <div className="px-4 mb-4 text-center">
        <div className="text-[10px] font-bold text-white/40 tracking-[0.15em] font-createfuture">
          {battle.is_official ? '⚔️ UFFICIALE' : 'AMICHEVOLE'} · ROUND {currentRound}
        </div>
        <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
          {battle.win_condition === 'total_battle' 
            ? `MODALITÀ TOTAL BATTLE (${deckSize} ROUND)` 
            : `Primo a ${battle.point_target} punti`}
        </div>
      </div>

      {/* SCOREBOARD */}
      <div className="mx-4 mb-6 rounded-2xl overflow-hidden border border-white/10"
        style={{ background: 'linear-gradient(135deg, #1A1A3A, #0F0F25)' }}>
        <div className="grid grid-cols-3 p-4">
          <div className="text-center">
            <div className="text-[10px] font-createfuture text-[#E94560] tracking-wider mb-1 uppercase">{p1Name}</div>
            <motion.div key={p1Score} className="text-5xl font-createfuture text-white"
              initial={{ scale: 1.3 }} animate={{ scale: 1 }}>{p1Score}</motion.div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-white/20 font-createfuture text-xl">VS</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-createfuture text-[#4361EE] tracking-wider mb-1 uppercase">{p2Name}</div>
            <motion.div key={p2Score} className="text-5xl font-createfuture text-white"
              initial={{ scale: 1.3 }} animate={{ scale: 1 }}>{p2Score}</motion.div>
          </div>
        </div>
        {battle.win_condition !== 'total_battle' && (
          <div className="px-4 pb-3">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
              <motion.div className="h-full bg-[#E94560]" animate={{ width: `${(p1Score / battle.point_target) * 50}%` }} />
              <div className="flex-1" />
              <motion.div className="h-full bg-[#4361EE]" animate={{ width: `${(p2Score / battle.point_target) * 50}%` }} />
            </div>
          </div>
        )}
      </div>

      {isComplete && (
        <div className="mx-4 mb-8">
          <motion.div className="mb-4 p-6 rounded-[32px] text-center border-2"
            style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.1), rgba(233,69,96,0.1))', borderColor: '#F5A623' }}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Trophy size={40} className="text-[#F5A623] mx-auto mb-3 drop-shadow-glow" />
            <div className="text-white text-2xl font-createfuture uppercase mb-1">
              {battle.winner_side === 'draw' ? 'PAREGGIO!' : (battle.winner_side === 'p1' ? p1Name : p2Name) + ' VINCE!'}
            </div>
            <div className="text-white/40 text-[10px] font-createfuture uppercase tracking-widest">
              RISULTATO FINALE: {p1Score} - {p2Score}
            </div>
          </motion.div>

          {isCreator ? (
            <motion.button 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={handleEndMatch}
              className="w-full py-5 rounded-[22px] bg-[#F5A623] text-white font-createfuture uppercase tracking-[0.2em] shadow-glow-accent"
            >
              Termina Incontro
            </motion.button>
          ) : (
            <motion.button 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                if (battle.tournament_id) navigate(`/battle/tournament/${battle.tournament_id}`);
                else navigate('/battle');
              }}
              className="w-full py-5 rounded-[22px] bg-white/5 border border-white/10 text-white/60 font-createfuture uppercase tracking-[0.2em]"
            >
              Torna alla Battle
            </motion.button>
          )}
        </div>
      )}

      {/* Finishing Button (if reached target but not yet saved as complete) */}
      {!isComplete && isTargetReached && (
        <div className="mx-4 mb-6">
           <button 
             onClick={handleEndMatch}
             className="w-full py-5 rounded-[22px] bg-[#F5A623] text-white font-createfuture uppercase tracking-[0.2em] shadow-glow-accent"
           >
             CONCLUDI MATCH
           </button>
        </div>
      )}
      
      {/* CONTROLS (Only for Creator/Admin) */}
      {!isComplete && !isTargetReached && isCreator && (
        <div className="mx-4 mb-6">
          <div className="text-[10px] font-black text-white/50 tracking-[0.2em] mb-3 text-center uppercase">Bey per questo round</div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <ComboSelector label={p1Name} combos={p1Combos} selected={selectedP1Combo} onSelect={setSelectedP1Combo} accentColor="#E94560" getBeyName={getBeyName} blades={parts.blades} />
            <ComboSelector label={p2Name} combos={p2Combos} selected={selectedP2Combo} onSelect={setSelectedP2Combo} accentColor="#4361EE" getBeyName={getBeyName} blades={parts.blades} />
          </div>

          <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3 uppercase text-center">Chi ha vinto questo round?</div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={() => setSelectedWinner('p1')} className={`py-4 rounded-xl border-2 font-createfuture text-sm transition-all ${selectedWinner === 'p1' ? 'bg-[#E94560] border-[#E94560] text-white' : 'bg-[#12122A] border-white/10 text-white/50'}`}>{p1Name}</button>
            <button onClick={() => { setSelectedWinner('draw'); setSelectedFinish('draw'); }} className={`py-4 rounded-xl border-2 font-createfuture text-xs transition-all ${selectedWinner === 'draw' ? 'bg-white/20 border-white/40 text-white' : 'bg-[#12122A] border-white/10 text-white/50'}`}>DRAW</button>
            <button onClick={() => setSelectedWinner('p2')} className={`py-4 rounded-xl border-2 font-createfuture text-sm transition-all ${selectedWinner === 'p2' ? 'bg-[#4361EE] border-[#4361EE] text-white' : 'bg-[#12122A] border-white/10 text-white/50'}`}>{p2Name}</button>
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
                      <span className="text-xs font-createfuture" style={{ color: ft.color }}>+{ft.points} PT</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          <motion.button onClick={submitRound} disabled={!selectedWinner || (!selectedFinish && selectedWinner !== 'draw')} whileTap={{ scale: 0.97 }} className="w-full py-4 rounded-xl font-bold tracking-wider text-white disabled:opacity-30 uppercase" style={{ background: 'linear-gradient(135deg, #E94560, #C9304A)', boxShadow: '0 4px 20px -4px rgba(233,69,96,0.5)' }}>
            Invia Round {currentRound}
          </motion.button>
        </div>
      )}

      {/* GUEST VIEW (Only for Non-Creator) */}
      {!isComplete && !isCreator && (
        <div className="mx-4 mb-6 p-8 rounded-[32px] bg-[#12122A] border border-white/5 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap size={32} className="text-primary" />
          </div>
          <div className="text-white font-black uppercase italic tracking-tighter text-xl mb-2">Match in corso</div>
          <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">L'arbitro sta inserendo i risultati</div>
        </div>
      )}

      {rounds.length > 0 && (
        <div className="mx-4 mb-6">
          <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3 uppercase">Storico Round</div>
          <div className="space-y-1.5">
            {rounds.map(r => {
              const ft = FINISH_TYPES.find(f => f.id === r.finish_type);
              const isConfirmed = r.status === 'confirmed';
              const isContested = r.status === 'contested';
              const needsAction = !isCreator && !r[`confirmed_by_${mySide}`];
              
              return (
                <div key={r.id} className={`flex items-center gap-3 p-4 rounded-[24px] bg-[#12122A] border transition-all 
                  ${isContested ? 'border-red-500/50 bg-red-500/5' : isConfirmed ? 'border-white/5' : 'border-yellow-500/30'}`}>
                  <div className="text-white/30 font-black text-[10px] w-6 text-center">R{r.round_number}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase italic truncate mb-0.5 flex items-center">
                      <span className="text-[#E94560]">{r.p1_combo_label ?? '—'}</span>
                      <span className="text-white/10 mx-2 text-[8px] not-italic">vs</span>
                      <span className="text-[#4361EE]">{r.p2_combo_label ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       {ft && <div className="text-[8px] font-black uppercase px-2 py-0.5 rounded" style={{ color: ft.color, background: `${ft.color}15` }}>{ft.name}</div>}
                       {isContested && <div className="text-[8px] font-black text-red-500 uppercase tracking-widest">Contestato</div>}
                       {!isConfirmed && !isContested && <div className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">In verifica</div>}
                    </div>
                  </div>
                  <div className={`text-xl font-createfuture ${r.winner_side === 'p1' ? 'text-[#E94560]' : r.winner_side === 'p2' ? 'text-[#4361EE]' : 'text-white/30'}`}>
                    {r.winner_side === 'p1' ? 'P1' : r.winner_side === 'p2' ? 'P2' : '—'}
                  </div>

                  {/* Actions for Guest */}
                  {needsAction && (
                    <div className="flex gap-2 ml-2">
                      <button onClick={() => confirmRound(r.id, 'contested')} className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20"><Minus size={14} /></button>
                      <button onClick={() => confirmRound(r.id, 'confirmed')} className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-wider shadow-glow-primary">OK</button>
                    </div>
                  )}

                  {/* Delete for Creator (to fix errors) */}
                  {isCreator && (
                    <button onClick={() => deleteRound(r.id)} className="p-2 text-white/10 hover:text-red-500 transition-colors"><RotateCcw size={14} /></button>
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

function ComboSelector({ label, combos, selected, onSelect, accentColor, getBeyName, blades }) {
  const [open, setOpen] = useState(false);
  const selectedBlade = selected ? blades.find(b => b.id === selected.blade_id) : null;

  return (
    <div className="relative">
      <div className="text-[9px] font-createfuture tracking-[0.2em] mb-2 uppercase opacity-40 text-center" style={{ color: accentColor }}>{label}</div>
      
      <button 
        onClick={() => setOpen(true)} 
        className="w-full p-3 rounded-[24px] bg-[#12122A] border border-white/10 text-left min-h-[70px] flex items-center gap-3 active:scale-95 transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
          {selectedBlade ? (
            <img src={selectedBlade.image_url} className="w-10 h-10 object-contain drop-shadow-glow" alt="" />
          ) : (
            <Plus size={18} className="text-white/20" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-[10px] font-black uppercase italic tracking-tighter truncate">
            {selected ? getBeyName(selected) : 'Scegli Bey'}
          </div>
          {!selected && <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-0.5">Nessun Bey</div>}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-[#0A0A1A] border-t border-white/10 rounded-t-[32px] z-[101] p-6 pb-12 max-h-[70vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Selezione Round</div>
                  <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Scegli Bey per {label}</h2>
                </div>
                <button onClick={() => setOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"><X size={20} /></button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {combos.map((c, idx) => {
                  const blade = blades.find(b => b.id === c.blade_id);
                  const isSelected = selected?.localId === c.localId;
                  return (
                    <button 
                      key={c.id || idx} 
                      onClick={() => { onSelect(c); setOpen(false); }}
                      className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all border
                        ${isSelected ? 'bg-primary/10 border-primary shadow-glow-primary-sm' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center p-2">
                           <img src={blade?.image_url} className="w-full h-full object-contain drop-shadow-glow" alt="" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-white uppercase italic leading-tight mb-1">{getBeyName(c)}</div>
                          <div className="flex items-center gap-2">
                             <div className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 text-white/30 uppercase tracking-widest">{blade?.type || 'Tipo Ignoto'}</div>
                             <div className="text-[8px] font-black text-primary uppercase tracking-widest italic">Slot {idx + 1}</div>
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shadow-glow-primary-sm">
                          <Check size={14} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function EloSummary({ result, battle, onDone }) {
  const { elo_before, elo_after, delta, opponent_id } = result;
  const isWin = delta > 0;
  
  const { display, tier, rank } = getRankFromElo(elo_after, true);
  const { target: nextTarget } = getNextThreshold(elo_after, true);

  let eloProgress = 0;
  if (nextTarget) {
    const currentRange = RANK_RANGES.find(r => elo_after >= r.minElo);
    const floor = currentRange ? currentRange.minElo : 0;
    const range = nextTarget - floor;
    eloProgress = ((elo_after - floor) / range) * 100;
    eloProgress = Math.max(5, Math.min(100, eloProgress));
  } else {
    eloProgress = 100;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A1A] flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      {/* Glows */}
      <div className={`absolute top-0 inset-x-0 h-96 opacity-20 blur-[100px] pointer-events-none
        ${isWin ? 'bg-primary' : 'bg-[#E94560]'}`} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-4 font-black text-[10px] uppercase tracking-[0.2em]
            ${isWin ? 'bg-primary/10 border-primary/20 text-primary shadow-glow-primary-sm' : 'bg-[#E94560]/10 border-[#E94560]/20 text-[#E94560]'}`}>
            {isWin ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isWin ? 'Vittoria Classificata' : 'Sconfitta Classificata'}
          </motion.div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            {isWin ? 'GRANDE VITTORIA!' : 'NON MOLLARE!'}
          </h2>
        </div>

        {/* ELO Card */}
        <div className="bg-[#12122A] border border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden mb-12">
           <div className="flex flex-col items-center">
              <div className="mb-6 relative">
                <RankBadge elo={elo_after} size="lg" showName={false} />
                <div className="absolute -bottom-2 -right-2 bg-white/10 backdrop-blur-md rounded-lg px-2 py-1 border border-white/5 text-[8px] font-black text-white/40 uppercase tracking-widest">
                  RANK UP?
                </div>
              </div>
              
              <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Nuovo Ranking</div>
              <div className="text-6xl font-black text-white italic tracking-tighter mb-6 flex items-baseline gap-3">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {elo_after}
                </motion.span>
                <motion.span 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className={`text-2xl font-black ${isWin ? 'text-primary' : 'text-[#E94560]'}`}
                >
                  {isWin ? '+' : ''}{delta}
                </motion.span>
              </div>

              {/* Next Rank Info */}
              <div className="w-full mt-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Prossimo Obiettivo</span>
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: tier.color }}>{display}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white italic font-createfuture">
                    {nextTarget ? nextTarget - elo_after : 'MAX'}
                  </span>
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Punti rimanenti per il prossimo Rank</span>
                </div>
              </div>
           </div>
           
           {/* Background Icon */}
           <Sparkles size={120} className="absolute -bottom-10 -right-10 text-white/[0.03] rotate-12" />
        </div>

        <button
          onClick={onDone}
          className="w-full py-5 bg-white text-[#0A0A1A] rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <span>Prosegui nell'Arena</span>
          <ChevronRight size={18} />
        </button>
      </motion.div>
    </div>
  );
}

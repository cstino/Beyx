import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, ChevronRight, Zap } from 'lucide-react';
import { OutcomePicker } from './OutcomePicker';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';

export function Match3v3Tracker({ myDeck, oppDeck, onComplete }) {
  const { user } = useAuthStore();
  const [round, setRound] = useState(1);
  const [myPoints, setMyPoints] = useState(0);
  const [oppPoints, setOppPoints] = useState(0);
  const [results, setResults] = useState([]);
  const [showOutcome, setShowOutcome] = useState(false);
  const [currentBattle, setCurrentBattle] = useState({
    player1: { user_id: user?.id, combo_id: null },
    player2: { user_id: oppDeck?.user_id, guest_name: oppDeck ? null : 'Avversario', combo_id: null },
    winner_side: null,
    win_type: null,
  });

  const isMatchOver = myPoints >= 3 || oppPoints >= 3;

  function handleOutcome(battleData) {
    const points = computePoints(battleData.win_type);
    const newMyPoints = battleData.winner_side === 'p1' ? myPoints + points : myPoints;
    const newOppPoints = battleData.winner_side === 'p2' ? oppPoints + points : oppPoints;
    
    setMyPoints(newMyPoints);
    setOppPoints(newOppPoints);
    setResults([...results, { ...battleData, points }]);
    setShowOutcome(false);
    setRound(round + 1);
  }

  function computePoints(winType) {
    switch (winType) {
      case 'burst': return 2;
      case 'xtreme': return 3;
      case 'ko': return 2;
      case 'spin_finish': return 1;
      default: return 0;
    }
  }

  return (
    <div className="space-y-8">
      {/* Scoreboard */}
      <div className="bg-[#12122A] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
        <div className="flex justify-between items-center relative z-10">
          <div className="text-center flex-1">
            <div className="text-[10px] font-black text-primary tracking-[0.2em] mb-2 uppercase">Tu</div>
            <div className="text-5xl font-black text-white italic tracking-tighter">{myPoints}</div>
          </div>
          
          <div className="px-4">
             <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
               <span className="text-xs font-black text-white/30 italic">VS</span>
             </div>
          </div>

          <div className="text-center flex-1">
            <div className="text-[10px] font-black text-[#4361EE] tracking-[0.2em] mb-2 uppercase">Opp</div>
            <div className="text-5xl font-black text-white italic tracking-tighter">{oppPoints}</div>
          </div>
        </div>

        {/* Round indicator */}
        <div className="mt-6 flex justify-center">
          <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
            Round {round}
          </div>
        </div>
      </div>

      {!isMatchOver ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
               <Swords size={20} />
             </div>
             <div className="flex-1">
                <div className="text-white font-black text-sm uppercase tracking-tight">Prossima Battaglia</div>
                <div className="text-white/30 text-[10px] font-bold uppercase">Registra l'esito del round</div>
             </div>
             <button 
               onClick={() => setShowOutcome(true)}
               className="p-3 rounded-xl bg-primary text-white shadow-glow-primary"
             >
               <Plus size={20} />
             </button>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 pt-4"
        >
          <div className="inline-flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-yellow-400/10 border-2 border-yellow-400/50 flex items-center justify-center text-yellow-400 mb-4 shadow-[0_0_40px_rgba(250,204,21,0.1)]">
              <Trophy size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter italic">Match Finito!</h2>
            <p className="text-white/40 text-[10px] font-black tracking-[0.2em] uppercase mt-2">
              {myPoints > oppPoints ? 'Hai Vinto la Sfida Deck' : 'L\'avversario ha vinto'}
            </p>
          </div>

          <button
            onClick={() => onComplete(results)}
            className="w-full py-5 rounded-2xl font-black text-[11px] tracking-[0.2em] text-white shadow-xl flex items-center justify-center gap-3 uppercase"
            style={{ background: 'linear-gradient(135deg, #E94560, #C9304A)' }}
          >
            Vai al Riepilogo <ChevronRight size={18} strokeWidth={3} />
          </button>
        </motion.div>
      )}

      {/* Outcome Sheet */}
      <AnimatePresence>
        {showOutcome && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowOutcome(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-[#0A0A1A] rounded-t-3xl p-6 overflow-y-auto no-scrollbar max-h-[90vh] border-t border-white/10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-white font-black uppercase tracking-tight italic">Esito Round {round}</h3>
                <button onClick={() => setShowOutcome(false)} className="text-white/20"><Plus className="rotate-45" /></button>
              </div>
              <OutcomePicker 
                battle={currentBattle}
                onChange={setCurrentBattle}
                onNext={() => handleOutcome(currentBattle)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

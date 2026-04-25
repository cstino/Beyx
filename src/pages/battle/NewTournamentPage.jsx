import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, LayoutGrid, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TournamentSetup } from '../../components/battle/TournamentSetup';
import { BracketView } from '../../components/battle/BracketView';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

export default function NewTournamentPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const setHeader = useUIStore(s => s.setHeader);
  const clearHeader = useUIStore(s => s.clearHeader);
  
  const [stage, setStage] = useState('setup'); // 'setup' | 'active'
  const [tournament, setTournament] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null); // { rIndex, mIndex }

  // Manage Global Header
  useEffect(() => {
    setHeader(stage === 'setup' ? 'Crea Torneo' : (tournament?.name || 'Torneo'), '/battle');
    return () => clearHeader();
  }, [stage, tournament, setHeader, clearHeader]);

  function generateBracket(participants) {
    const roundCount = Math.ceil(Math.log2(participants.length));
    const bracketSize = Math.pow(2, roundCount);
    
    // 1. Initial round with potential BYEs
    const firstRoundMatches = [];
    for (let i = 0; i < bracketSize / 2; i++) {
       const p1 = participants[i * 2] || { username: 'BYE', isBye: true };
       const p2 = participants[i * 2 + 1] || { username: 'BYE', isBye: true };
       
       let winner = null;
       if (p1.isBye) winner = 'p2';
       else if (p2.isBye) winner = 'p1';

       firstRoundMatches.push({ p1, p2, winner });
    }

    const rounds = [{ matches: firstRoundMatches }];
    let currentMatchCount = firstRoundMatches.length;
    let rIdx = 0;
    
    // 2. Generate subsequent rounds and handle BYE advancement
    while (currentMatchCount > 1) {
       currentMatchCount /= 2;
       const nextMatches = Array(currentMatchCount).fill(null).map(() => ({ p1: null, p2: null, winner: null }));
       
       // Advance winners from current round to next matches
       const currentMatches = rounds[rIdx].matches;
       currentMatches.forEach((m, mIdx) => {
         if (m.winner) {
           const nextMIdx = Math.floor(mIdx / 2);
           const winnerObj = m.winner === 'p1' ? m.p1 : m.p2;
           if (mIdx % 2 === 0) nextMatches[nextMIdx].p1 = winnerObj;
           else nextMatches[nextMIdx].p2 = winnerObj;
         }
       });

       // Check for new BYE-induced winners in the next matches
       nextMatches.forEach(m => {
          if (m.p1 && m.p2 && (m.p1.isBye || m.p2.isBye)) {
            m.winner = m.p1.isBye ? 'p2' : 'p1';
          }
       });

       rounds.push({ matches: nextMatches });
       rIdx++;
    }

    return { rounds };
  }

  function generateRoundRobin(participants) {
    const list = [...participants];
    if (list.length % 2 !== 0) list.push({ username: 'FREE ROUND', isBye: true });
    
    const roundsCount = list.length - 1;
    const matchesPerRound = list.length / 2;
    const rounds = [];

    for (let j = 0; j < roundsCount; j++) {
      const matches = [];
      for (let i = 0; i < matchesPerRound; i++) {
        const p1 = list[i];
        const p2 = list[list.length - 1 - i];
        matches.push({ p1, p2, winner: null });
      }
      rounds.push({ matches });
      list.splice(1, 0, list.pop());
    }

    return { rounds };
  }

  async function handleCreate(config) {
    const name = config.name || `Torneo ${new Date().toLocaleDateString()}`;
    const structure = config.format === 'bracket' 
      ? generateBracket(config.participants) 
      : generateRoundRobin(config.participants);

    const { data, error } = await supabase.from('tournaments').insert({
      name: name,
      format: config.format,
      battle_type: config.battleType,
      participants: config.participants,
      structure: structure,
      created_by: user.id,
    }).select().single();

    if (error) {
      console.error('Error creating tournament:', error);
      return;
    }
    setTournament(data);
    setStage('active');
  }

  function handleMatchWin(winnerSide) {
    const { rIndex, mIndex } = activeMatch;
    const newStructure = JSON.parse(JSON.stringify(tournament.structure));
    const currentMatch = newStructure.rounds[rIndex].matches[mIndex];
    
    currentMatch.winner = winnerSide;
    const winner = winnerSide === 'p1' ? currentMatch.p1 : currentMatch.p2;

    if (tournament.format === 'bracket') {
      if (rIndex < newStructure.rounds.length - 1) {
         let currentR = rIndex;
         let currentM = mIndex;
         let currentWinner = winner;

         while (currentR < newStructure.rounds.length - 1) {
            const nextR = currentR + 1;
            const nextM = Math.floor(currentM / 2);
            const targetPair = nextM;
            
            // Advance to next round
            if (currentM % 2 === 0) newStructure.rounds[nextR].matches[targetPair].p1 = currentWinner;
            else newStructure.rounds[nextR].matches[targetPair].p2 = currentWinner;

            // Check if this results in another automatic BYE win
            const nextMatch = newStructure.rounds[nextR].matches[targetPair];
            if (nextMatch.p1 && nextMatch.p2 && (nextMatch.p1.isBye || nextMatch.p2.isBye)) {
               nextMatch.winner = nextMatch.p1.isBye ? 'p2' : 'p1';
               currentWinner = nextMatch.winner === 'p1' ? nextMatch.p1 : nextMatch.p2;
               currentR = nextR;
               currentM = nextM;
            } else {
               break;
            }
         }
      } else {
         tournament.status = 'completed';
         tournament.winner_user_id = winner.user_id;
         tournament.winner_guest_name = winner.guest_name;
      }
    }

    setTournament({ ...tournament, structure: newStructure });
    setActiveMatch(null);
    updateTournamentDB(newStructure);
  }

  async function updateTournamentDB(structure) {
    await supabase.from('tournaments')
      .update({ structure, status: tournament.status, winner_user_id: tournament.winner_user_id, winner_guest_name: tournament.winner_guest_name })
      .eq('id', tournament.id);
  }

  return (
    <div className="min-h-screen pb-32 flex flex-col pt-6">
      <div className="px-6 flex-1">
         {stage === 'setup' ? (
           <TournamentSetup onConfirm={handleCreate} />
         ) : (
           <BracketView 
             tournament={tournament} 
             onSelectMatch={(rIndex, mIndex) => setActiveMatch({ rIndex, mIndex })}
           />
         )}
      </div>

      <AnimatePresence>
        {activeMatch && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#0A0A1A] flex flex-col pt-12"
          >
            <div className="flex justify-end px-6">
               <button onClick={() => setActiveMatch(null)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="px-6 py-12 text-center">
                 <div className="text-white/20 text-xs font-black tracking-widest uppercase mb-12 italic">Match in Corso...</div>
                 <div className="flex items-center justify-around mb-20">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-20 h-20 rounded-3xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary text-2xl font-black italic">P1</div>
                       <span className="text-white font-black uppercase text-sm">{tournament.structure.rounds[activeMatch.rIndex].matches[activeMatch.mIndex].p1.username}</span>
                       <button onClick={() => handleMatchWin('p1')} className="px-6 py-3 rounded-xl bg-primary text-white text-[10px] font-black tracking-widest uppercase shadow-glow-primary">Vince P1</button>
                    </div>
                    <div className="text-white font-black text-4xl italic opacity-10">VS</div>
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-20 h-20 rounded-3xl bg-[#4361EE]/20 border-2 border-[#4361EE]/40 flex items-center justify-center text-[#4361EE] text-2xl font-black italic">P2</div>
                       <span className="text-white font-black uppercase text-sm">{tournament.structure.rounds[activeMatch.rIndex].matches[activeMatch.mIndex].p2.username}</span>
                       <button onClick={() => handleMatchWin('p2')} className="px-6 py-3 rounded-xl bg-[#4361EE] text-white text-[10px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(67,97,238,0.3)]">Vince P2</button>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

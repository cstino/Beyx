import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trophy, LayoutGrid, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TournamentSetup } from '../../components/battle/TournamentSetup';
import { BracketView } from '../../components/battle/BracketView';
import New1v1Page from './New1v1Page';
import New3v3Page from './New3v3Page';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';

export default function NewTournamentPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stage, setStage] = useState('setup'); // 'setup' | 'active'
  const [tournament, setTournament] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null); // { rIndex, mIndex }

  function generateBracket(participants) {
    const roundCount = Math.ceil(Math.log2(participants.length));
    const bracketSize = Math.pow(2, roundCount);
    
    // Fill with players and byes
    const firstRoundMatches = [];
    for (let i = 0; i < bracketSize / 2; i++) {
       firstRoundMatches.push({
         p1: participants[i * 2] || null,
         p2: participants[i * 2 + 1] || null,
         winner: null,
       });
    }

    const rounds = [{ matches: firstRoundMatches }];
    let currentMatchCount = firstRoundMatches.length;
    
    while (currentMatchCount > 1) {
       currentMatchCount /= 2;
       rounds.push({
         matches: Array(currentMatchCount).fill(null).map(() => ({ p1: null, p2: null, winner: null }))
       });
    }

    return { rounds };
  }

  async function handleCreate(config) {
    const structure = generateBracket(config.participants);
    const { data, error } = await supabase.from('tournaments').insert({
      name: config.name,
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

    // Advance to next round if exists
    if (rIndex < newStructure.rounds.length - 1) {
       const nextMatch = newStructure.rounds[rIndex + 1].matches[Math.floor(mIndex / 2)];
       if (mIndex % 2 === 0) nextMatch.p1 = winner;
       else nextMatch.p2 = winner;
    } else {
       // Tournament Over
       tournament.status = 'completed';
       tournament.winner_user_id = winner.user_id;
       tournament.winner_guest_name = winner.guest_name;
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
    <div className="min-h-screen bg-[#0A0A1A] pb-32 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-[#0A0A1A]/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/battle')} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5">
            <ChevronLeft size={22} />
          </button>
          <div>
            <div className="text-[10px] font-black text-[#F5A623] tracking-[0.2em] uppercase">Arena Tournaments</div>
            <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
              {stage === 'setup' ? 'Crea Torneo' : tournament?.name}
            </h1>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#F5A623]/10 flex items-center justify-center text-[#F5A623] border border-[#F5A623]/20">
          <Trophy size={20} />
        </div>
      </div>

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

      {/* Match Overlay Wizard */}
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
              {/* Here we'd ideally load a sub-flow of 1v1 or 3v3 wizard, 
                  but for the "MVP/Brief" we'll show a quick simulation button
                  or we can link the real component with preset players */}
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

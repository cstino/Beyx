import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Trophy, ChevronRight } from 'lucide-react';

export function BracketView({ tournament, onSelectMatch }) {
  const { structure, participants } = tournament;
  const rounds = structure.rounds || [];

  return (
    <div className="space-y-12 pb-24 overflow-x-auto no-scrollbar">
      <div className="flex gap-12 min-w-max px-4">
        {rounds.map((round, rIndex) => (
          <div key={rIndex} className="flex flex-col gap-8 justify-around">
            <div className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase mb-4 text-center">
              {rIndex === rounds.length - 1 ? 'Finale' : rIndex === rounds.length - 2 ? 'Semifinali' : `Round ${rIndex + 1}`}
            </div>
            
            {round.matches.map((match, mIndex) => {
              const p1 = match.p1;
              const p2 = match.p2;
              const active = !match.winner && p1 && p2;
              const completed = !!match.winner;

              return (
                <div key={mIndex} className="relative">
                  {/* Connection lines */}
                  {rIndex < rounds.length - 1 && (
                    <div className="absolute top-1/2 -right-12 w-12 h-[2px] bg-white/5" />
                  )}

                  <motion.button
                    whileTap={active ? { scale: 0.98 } : {}}
                    onClick={() => active && onSelectMatch(rIndex, mIndex)}
                    className={`w-48 rounded-2xl border transition-all relative overflow-hidden text-left
                      ${active ? 'bg-[#12122A] border-primary/40 shadow-glow-primary cursor-pointer' : 
                        completed ? 'bg-white/5 border-white/10 opacity-60' : 'bg-[#0A0A1A] border-white/5 opacity-40'}`}
                  >
                    <div className="px-4 py-3 space-y-2">
                       {/* Player 1 */}
                       <div className="flex items-center justify-between">
                         <span className={`text-[10px] font-black uppercase truncate italic ${match.winner === 'p1' ? 'text-primary' : 'text-white'}`}>
                           {p1?.username || 'TBD'}
                         </span>
                         {match.winner === 'p1' && <Trophy size={10} className="text-primary" />}
                       </div>
                       
                       <div className="h-[1px] bg-white/5 w-full" />

                       {/* Player 2 */}
                       <div className="flex items-center justify-between">
                         <span className={`text-[10px] font-black uppercase truncate italic ${match.winner === 'p2' ? 'text-primary' : 'text-white'}`}>
                           {p2?.username || 'TBD'}
                         </span>
                         {match.winner === 'p2' && <Trophy size={10} className="text-primary" />}
                       </div>
                    </div>

                    {active && (
                      <div className="bg-primary/10 h-6 flex items-center justify-center gap-1 border-t border-primary/20">
                         <Swords size={10} className="text-primary" />
                         <span className="text-[8px] font-black text-primary tracking-widest uppercase">Gioca Ora</span>
                      </div>
                    )}
                  </motion.button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

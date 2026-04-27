import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Trophy, ChevronRight, LayoutList } from 'lucide-react';

export function BracketView({ tournament, onSelectMatch }) {
  const { structure, participants, format } = tournament;
  const rounds = structure.rounds || [];

  if (format === 'round_robin') {
    return (
      <div className="space-y-12 pb-32">
        {rounds.map((round, rIndex) => (
          <div key={rIndex} className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="h-[1px] flex-1 bg-white/5" />
              <div className="text-[10px] font-black text-[#F5A623] tracking-[0.3em] uppercase italic whitespace-nowrap">
                Giornata {rIndex + 1}
              </div>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {round.matches.map((match, mIndex) => {
                const active = !match.winner && !match.p1?.isBye && !match.p2?.isBye;
                const completed = !!match.winner;
                const isByeMatch = match.p1?.isBye || match.p2?.isBye;

                if (isByeMatch) return null; // Skip bye matches in UI to save space

                return (
                  <MatchCard 
                    key={mIndex}
                    match={match}
                    active={active}
                    completed={completed}
                    onClick={() => active && onSelectMatch(rIndex, mIndex)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Classic Bracket View
  return (
    <div className="pb-24 overflow-x-auto no-scrollbar">
      <div className="flex gap-16 min-w-max px-8 pt-8">
        {rounds.map((round, rIndex) => (
          <div key={rIndex} className="flex flex-col">
            {/* Round Title */}
            <div className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase mb-12 text-center h-4">
              {rIndex === rounds.length - 1 ? 'Finale' : rIndex === rounds.length - 2 ? 'Semifinali' : rIndex === rounds.length - 3 ? 'Quarti' : `Round ${rIndex + 1}`}
            </div>
            
            <div className="flex-1 flex flex-col justify-around">
              {round.matches.map((match, mIndex) => {
                const active = !match.winner && match.p1 && match.p2 && !match.p1?.isBye && !match.p2?.isBye;
                const completed = !!match.winner;
                
                // Calculate vertical spacing based on round
                // Each round matches should be vertically centered relative to the ones before
                const matchHeight = 84; // Approx height of MatchCard
                const roundSpacing = Math.pow(2, rIndex) * 20;

                return (
                  <div 
                    key={mIndex} 
                    className="relative flex items-center"
                    style={{ margin: `${roundSpacing}px 0`, minHeight: matchHeight }}
                  >
                    {/* Connection lines to NEXT round */}
                    {rIndex < rounds.length - 1 && (
                      <div className="absolute top-1/2 -right-16 w-16 h-[2px] bg-white/5 flex items-center">
                         {/* Fork visualizer */}
                         <div className={`absolute right-0 w-[2px] bg-white/5
                           ${mIndex % 2 === 0 ? 'h-[100%] top-0' : 'h-[100%] bottom-0'}
                         `} style={{ height: `calc(50% + ${roundSpacing}px + 4px)` }} />
                      </div>
                    )}

                    {/* Connection lines from PREVIOUS round */}
                    {rIndex > 0 && (
                       <div className="absolute top-1/2 -left-16 w-8 h-[2px] bg-white/5" />
                    )}

                    <MatchCard 
                      match={match}
                      active={active}
                      completed={completed}
                      onClick={() => active && onSelectMatch(rIndex, mIndex)}
                      className="w-56 z-10"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match, active, completed, onClick, className = "" }) {
  const p1 = match.p1;
  const p2 = match.p2;

  return (
    <motion.button
      whileTap={active ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`rounded-2xl border transition-all relative overflow-hidden text-left ${className}
        ${active ? 'bg-[#12122A] border-primary/40 shadow-glow-primary cursor-pointer' : 
          completed ? 'bg-white/5 border-white/10 opacity-60' : 'bg-[#0A0A1A] border-white/5 opacity-40'}`}
    >
      <div className="px-5 py-4 space-y-3">
         {/* Player 1 */}
         <div className="flex items-center justify-between">
           <span className={`text-[11px] font-black uppercase truncate italic tracking-tight ${match.winner === 'p1' ? 'text-primary' : 'text-white/80'}`}>
             {p1?.username || 'TBD'}
           </span>
           {match.winner === 'p1' && <Trophy size={12} className="text-primary drop-shadow-glow" />}
         </div>
         
         <div className="h-[1px] bg-white/5 w-full" />

         {/* Player 2 */}
         <div className="flex items-center justify-between">
           <span className={`text-[11px] font-black uppercase truncate italic tracking-tight ${match.winner === 'p2' ? 'text-primary' : 'text-white/80'}`}>
             {p2?.username || 'TBD'}
           </span>
           {match.winner === 'p2' && <Trophy size={12} className="text-primary drop-shadow-glow" />}
         </div>
      </div>

      {active && (
        <div className="bg-primary/10 py-2 flex items-center justify-center gap-2 border-t border-primary/20">
           <Swords size={12} className="text-primary" />
           <span className="text-[9px] font-black text-primary tracking-[0.2em] uppercase">Gioca Ora</span>
        </div>
      )}
    </motion.button>
  );
}

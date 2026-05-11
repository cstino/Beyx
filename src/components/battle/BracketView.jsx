import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Trophy, ChevronRight, LayoutList } from 'lucide-react';

export function BracketView({ tournament, onSelectMatch }) {
  const { structure, participants, format } = tournament;
  const rounds = structure.rounds || [];

  if (format === 'round_robin') {
    const standings = calculateStandings(tournament);
    const rrRounds = rounds.filter(r => !r.isPlayoff);
    const playoffRounds = rounds.filter(r => r.isPlayoff);

    return (
      <div className="space-y-12 pb-32">
        {/* Standings Table */}
        <div className="px-1">
          <StandingsTable standings={standings} />
        </div>

        {/* Playoff Section if exists */}
        {playoffRounds.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-1">
              <Trophy size={16} className="text-primary" />
              <div className="text-xs font-black text-white tracking-[0.3em] uppercase italic whitespace-nowrap">
                Fase Playoff
              </div>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>
            
            <div className="flex gap-8 overflow-x-auto no-scrollbar py-4">
              {playoffRounds.map((round, rIndex) => (
                <div key={rIndex} className="space-y-4 min-w-[240px]">
                  <div className="text-[9px] font-black text-white/20 tracking-widest uppercase text-center">{round.title || `Playoff ${rIndex + 1}`}</div>
                  <div className="space-y-3">
                    {round.matches.map((match, mIndex) => {
                      const active = !match.winner && match.p1 && match.p2;
                      return (
                        <MatchCard 
                          key={mIndex}
                          match={match}
                          active={active}
                          completed={!!match.winner}
                          onClick={() => active && onSelectMatch(rounds.indexOf(round), mIndex)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group Rounds */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-1">
             <LayoutList size={16} className="text-[#F5A623]" />
             <div className="text-xs font-createfuture text-white tracking-[0.3em] uppercase italic whitespace-nowrap">
               Fase a Turni
             </div>
             <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          {rrRounds.map((round, rIndex) => (
            <div key={rIndex} className="space-y-4">
              <div className="text-[10px] font-createfuture text-[#F5A623]/60 tracking-[0.3em] uppercase italic px-1">
                Turno {rIndex + 1} {round.cycle > 1 ? `(Giro ${round.cycle})` : ''}
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {round.matches.map((match, mIndex) => {
                  const completed = !!match.winner;
                  const isByeMatch = match.p1?.isBye || match.p2?.isBye;
                  if (isByeMatch) return null;

                  // Locking logic: find all previous matches and check if they are completed
                  let previousMatchesCompleted = true;
                  for (let i = 0; i <= rIndex; i++) {
                    const r = rrRounds[i];
                    for (let j = 0; j < r.matches.length; j++) {
                      const m = r.matches[j];
                      if (m.p1?.isBye || m.p2?.isBye) continue;
                      if (i === rIndex && j === mIndex) break; // Reached current match
                      if (!m.winner) {
                        previousMatchesCompleted = false;
                        break;
                      }
                    }
                    if (!previousMatchesCompleted) break;
                  }

                  const active = !completed && previousMatchesCompleted;

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
      </div>
    );
  }

function StandingsTable({ standings }) {
  return (
    <div className="bg-[#12122A] rounded-[32px] border border-white/5 overflow-hidden shadow-xl">
      <div className="bg-white/5 px-6 py-4 border-b border-white/5">
        <div className="text-[10px] font-createfuture text-primary tracking-[0.2em] uppercase italic">Classifica Girone</div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[8px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">
              <th className="px-4 py-4 w-12 text-center">#</th>
              <th className="px-4 py-4">Blader</th>
              <th className="px-2 py-4 text-center">G</th>
              <th className="px-2 py-4 text-center">V</th>
              <th className="px-2 py-4 text-center">P</th>
              <th className="px-2 py-4 text-center">KO</th>
              <th className="px-4 py-4 text-right">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((s, i) => (
              <tr key={s.user_id || s.guest_name} className="text-[11px] font-black text-white uppercase">
                <td className="px-4 py-4 text-center text-white/20 font-createfuture">{i + 1}</td>
                <td className="px-4 py-4 truncate max-w-[100px] font-createfuture">{s.username}</td>
                <td className="px-2 py-4 text-center text-white/40">{s.played}</td>
                <td className="px-2 py-4 text-center text-green-500/60">{s.won}</td>
                <td className="px-2 py-4 text-center text-red-500/60">{s.lost}</td>
                <td className="px-2 py-4 text-center text-white/60 font-createfuture">{s.koPoints}</td>
                <td className="px-4 py-4 text-right text-primary font-createfuture text-sm">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function calculateStandings(tournament) {
  const participants = tournament.participants || [];
  const rounds = tournament.structure.rounds || [];
  
  const stats = participants.filter(p => !p.isBye).map(p => ({
    ...p,
    played: 0,
    won: 0,
    lost: 0,
    koPoints: 0,
    points: 0
  }));

  rounds.forEach(r => {
    if (r.isPlayoff) return; // Only count group stage for standings
    r.matches.forEach(m => {
      if (m.winner) {
        const p1Id = m.p1.user_id || m.p1.username;
        const p2Id = m.p2.user_id || m.p2.username;
        
        const s1 = stats.find(s => (s.user_id || s.username) === p1Id);
        const s2 = stats.find(s => (s.user_id || s.username) === p2Id);
        
        if (s1) s1.played++;
        if (s2) s2.played++;
        
        if (m.score) {
          if (s1) s1.koPoints += (m.score.p1 || 0);
          if (s2) s2.koPoints += (m.score.p2 || 0);
        }
        
        if (m.winner === 'p1') {
          if (s1) { s1.won++; s1.points += 3; }
          if (s2) { s2.lost++; }
        } else if (m.winner === 'p2') {
          if (s2) { s2.won++; s2.points += 3; }
          if (s1) { s1.lost++; }
        } else if (m.winner === 'draw') {
          if (s1) { s1.points += 1; }
          if (s2) { s2.points += 1; }
        }
      }
    });
  });

  return stats.sort((a, b) => b.points - a.points || b.koPoints - a.koPoints || b.won - a.won);
}

  // Classic Bracket View
  return (
    <div className="pb-24 overflow-x-auto no-scrollbar">
      <div className="flex gap-16 min-w-max px-8 pt-8">
        {rounds.map((round, rIndex) => (
          <div key={rIndex} className="flex flex-col">
            {/* Round Title */}
            <div className="text-[10px] font-createfuture text-white/20 tracking-[0.3em] uppercase mb-12 text-center h-4">
              {rIndex === rounds.length - 1 ? 'Finale' : rIndex === rounds.length - 2 ? 'Semifinali' : rIndex === rounds.length - 3 ? 'Quarti' : `Turno ${rIndex + 1}`}
            </div>
            
            <div className="flex-1 flex flex-col justify-around">
              {round.matches.map((match, mIndex) => {
                const completed = !!match.winner;
                
                // Sequential locking logic for bracket
                let previousMatchesCompleted = true;
                for (let i = 0; i <= rIndex; i++) {
                  const r = rounds[i];
                  for (let j = 0; j < r.matches.length; j++) {
                    const m = r.matches[j];
                    if (!m.p1 || !m.p2 || m.p1.isBye || m.p2.isBye) continue;
                    if (i === rIndex && j === mIndex) break;
                    if (!m.winner) {
                      previousMatchesCompleted = false;
                      break;
                    }
                  }
                  if (!previousMatchesCompleted) break;
                }

                const active = !completed && match.p1 && match.p2 && !match.p1.isBye && !match.p2.isBye && previousMatchesCompleted;
                
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
         <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-2 truncate">
             <span className={`text-[11px] font-createfuture uppercase truncate ${match.winner === 'p1' ? 'text-primary' : 'text-white/80'}`}>
               {p1?.username || 'TBD'}
             </span>
             {match.winner === 'p1' && <Trophy size={12} className="text-primary shrink-0 drop-shadow-glow" />}
           </div>
           {completed && <span className={`text-xs font-createfuture shrink-0 ${match.winner === 'p1' ? 'text-primary' : 'text-white/40'}`}>{match.score?.p1 ?? 0}</span>}
         </div>
         
         <div className="h-[1px] bg-white/5 w-full" />

         {/* Player 2 */}
         <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-2 truncate">
             <span className={`text-[11px] font-createfuture uppercase truncate ${match.winner === 'p2' ? 'text-primary' : 'text-white/80'}`}>
               {p2?.username || 'TBD'}
             </span>
             {match.winner === 'p2' && <Trophy size={12} className="text-primary shrink-0 drop-shadow-glow" />}
           </div>
           {completed && <span className={`text-xs font-createfuture shrink-0 ${match.winner === 'p2' ? 'text-primary' : 'text-white/40'}`}>{match.score?.p2 ?? 0}</span>}
         </div>
      </div>

      {active && (
        <div className="bg-primary/10 py-2 flex items-center justify-center gap-2 border-t border-primary/20">
           <Swords size={12} className="text-primary" />
           <span className="text-[9px] font-createfuture text-primary tracking-[0.2em] uppercase">Gioca Ora</span>
        </div>
      )}
    </motion.button>
  );
}

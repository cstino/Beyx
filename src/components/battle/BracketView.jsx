import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Trophy, ChevronRight, LayoutList, ChevronDown, Clock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export function BracketView({ tournament, onSelectMatch }) {
  const { structure, participants, format } = tournament;
  const rounds = structure.rounds || [];
  const { user } = useAuthStore();

  const [isStandingsOpen, setIsStandingsOpen] = React.useState(false);
  const [isUpcomingOpen, setIsUpcomingOpen] = React.useState(false);
  const [isPastOpen, setIsPastOpen] = React.useState(false);

  if (format === 'round_robin') {
    const standings = calculateStandings(tournament);
    
    // Find the next/active match globally
    let nextMatchData = null;
    const upcomingList = [];
    const pastList = [];

    // Traverse all rounds to classify matches
    rounds.forEach((r, absoluteRIndex) => {
      const isPlayoff = r.isPlayoff;
      const roundTitle = r.title || (isPlayoff ? `Playoff` : `Turno ${absoluteRIndex + 1} ${r.cycle > 1 ? `(Giro ${r.cycle})` : ''}`);
      
      r.matches?.forEach((m, mIndex) => {
        if (m.p1?.isBye || m.p2?.isBye) return;

        // Determine if this match is the active/next one
        if (!m.winner) {
          if (!nextMatchData && m.p1 && m.p2) {
            // Check if all prior round-robin / non-bye matches are completed
            let priorCompleted = true;
            for (let prIdx = 0; prIdx <= absoluteRIndex; prIdx++) {
              const pr = rounds[prIdx];
              for (let pmIdx = 0; pmIdx < pr.matches.length; pmIdx++) {
                const pm = pr.matches[pmIdx];
                if (pm.p1?.isBye || pm.p2?.isBye) continue;
                if (prIdx === absoluteRIndex && pmIdx === mIndex) break;
                if (!pm.winner) {
                  priorCompleted = false;
                  break;
                }
              }
              if (!priorCompleted) break;
            }
            if (priorCompleted) {
              nextMatchData = { match: m, rIndex: absoluteRIndex, mIndex, roundTitle };
            }
          }

          upcomingList.push({ match: m, rIndex: absoluteRIndex, mIndex, roundTitle });
        } else {
          pastList.push({ match: m, rIndex: absoluteRIndex, mIndex, roundTitle });
        }
      });
    });

    // Remove the active nextMatchData from upcomingList
    const filteredUpcomingList = nextMatchData 
      ? upcomingList.filter(u => !(u.rIndex === nextMatchData.rIndex && u.mIndex === nextMatchData.mIndex)) 
      : upcomingList;

    // Reverse pastList so newest completed match is at the top
    pastList.reverse();

    // Check if user is involved in nextMatchData
    const isUserInvolved = nextMatchData && user && (
      (nextMatchData.match.p1?.user_id || nextMatchData.match.p1?.username) === (user.id || user.user_metadata?.username || user.username) ||
      (nextMatchData.match.p2?.user_id || nextMatchData.match.p2?.username) === (user.id || user.user_metadata?.username || user.username)
    );

    return (
      <div className="space-y-6 pb-32 w-full max-w-xl mx-auto px-1">
        {/* TOP SECTION: NEXT ACTIVE MATCH */}
        {nextMatchData ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div className="text-[10px] font-createfuture text-white/40 tracking-[0.2em] uppercase italic">
                Prossimo Match Globale
              </div>
              <div className="text-[9px] font-createfuture text-primary tracking-widest uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                {nextMatchData.roundTitle}
              </div>
            </div>

            <div className={`relative rounded-3xl p-1 transition-all duration-500 ${
              isUserInvolved 
                ? 'bg-gradient-to-r from-primary via-[#E94560] to-primary p-[2px] shadow-[0_0_25px_rgba(233,69,96,0.3)] animate-pulse' 
                : 'bg-white/5 border border-white/10'
            }`}>
              {isUserInvolved && (
                <div className="absolute -top-3 right-4 bg-[#E94560] text-white font-createfuture text-[9px] font-black tracking-widest px-3 py-0.5 rounded-full uppercase shadow-lg z-20 animate-bounce">
                  TOCCA A TE
                </div>
              )}

              <div className="bg-[#0A0A1A] rounded-[22px] overflow-hidden">
                <MatchCard 
                  match={nextMatchData.match}
                  active={true}
                  completed={false}
                  onClick={() => onSelectMatch(nextMatchData.rIndex, nextMatchData.mIndex)}
                  className="w-full border-0 shadow-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
            <div className="text-xs font-createfuture text-white/40 uppercase tracking-widest">
              Nessun match in attesa
            </div>
          </div>
        )}

        {/* ACCORDION CARDS */}
        
        {/* 1. Classifica Card */}
        <div className="bg-[#12122A] rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
          <button 
            onClick={() => setIsStandingsOpen(!isStandingsOpen)}
            className="w-full px-5 py-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Trophy size={16} className="text-[#F5A623]" />
              <span className="font-createfuture text-xs font-black text-white uppercase tracking-widest">
                Classifica Girone
              </span>
            </div>
            <div className={`text-white/40 transition-transform duration-300 ${isStandingsOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </div>
          </button>
          
          {isStandingsOpen && (
            <div className="border-t border-white/5 bg-[#0A0A1A]/40 animate-fade-in">
              <StandingsTable standings={standings} />
            </div>
          )}
        </div>

        {/* 2. Prossimi Match Card */}
        <div className="bg-[#12122A] rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
          <button 
            onClick={() => setIsUpcomingOpen(!isUpcomingOpen)}
            className="w-full px-5 py-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-primary" />
              <span className="font-createfuture text-xs font-black text-white uppercase tracking-widest">
                Prossimi Match ({filteredUpcomingList.length})
              </span>
            </div>
            <div className={`text-white/40 transition-transform duration-300 ${isUpcomingOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </div>
          </button>

          {isUpcomingOpen && (
            <div className="border-t border-white/5 p-3 space-y-2 bg-[#0A0A1A]/40 animate-fade-in max-h-96 overflow-y-auto no-scrollbar">
              {filteredUpcomingList.length > 0 ? filteredUpcomingList.map((item, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col gap-1">
                  <div className="text-[8px] font-createfuture text-white/30 uppercase tracking-widest">
                    {item.roundTitle}
                  </div>
                  <div className="flex items-center justify-between text-xs font-createfuture uppercase">
                    <span className="text-white/80 truncate flex-1 text-left pr-2">
                      {item.match.p1?.username || 'TBD'}
                    </span>
                    <span className="text-[8px] text-white/20 px-2 shrink-0">VS</span>
                    <span className="text-white/80 truncate flex-1 text-right pl-2">
                      {item.match.p2?.username || 'TBD'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-[10px] font-createfuture text-white/20 uppercase tracking-widest">
                  Nessun altro match in programma
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Match Passati Card */}
        <div className="bg-[#12122A] rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
          <button 
            onClick={() => setIsPastOpen(!isPastOpen)}
            className="w-full px-5 py-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-[#E94560]" />
              <span className="font-createfuture text-xs font-black text-white uppercase tracking-widest">
                Match Passati ({pastList.length})
              </span>
            </div>
            <div className={`text-white/40 transition-transform duration-300 ${isPastOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </div>
          </button>

          {isPastOpen && (
            <div className="border-t border-white/5 p-3 space-y-2 bg-[#0A0A1A]/40 animate-fade-in max-h-96 overflow-y-auto no-scrollbar">
              {pastList.length > 0 ? pastList.map((item, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col gap-1.5">
                  <div className="text-[8px] font-createfuture text-white/30 uppercase tracking-widest">
                    {item.roundTitle}
                  </div>
                  <div className="flex items-center justify-between font-createfuture uppercase text-xs">
                    <span className={`truncate flex-1 text-left pr-2 ${item.match.winner === 'p1' ? 'text-primary' : 'text-white/60'}`}>
                      {item.match.p1?.username}
                    </span>
                    
                    <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white shrink-0">
                      {item.match.score?.p1 ?? 0} - {item.match.score?.p2 ?? 0}
                    </div>

                    <span className={`truncate flex-1 text-right pl-2 ${item.match.winner === 'p2' ? 'text-primary' : 'text-white/60'}`}>
                      {item.match.p2?.username}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-[10px] font-createfuture text-white/20 uppercase tracking-widest">
                  Nessun match completato
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

function StandingsTable({ standings }) {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[8px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">
              <th className="px-3 py-3 w-8 text-center">#</th>
              <th className="px-3 py-3">Blader</th>
              <th className="px-1.5 py-3 text-center">W</th>
              <th className="px-1.5 py-3 text-center">L</th>
              <th className="px-1.5 py-3 text-center">D</th>
              <th className="px-1.5 py-3 text-center">KO</th>
              <th className="px-3 py-3 text-right">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((s, i) => (
              <tr key={s.user_id || s.guest_name || s.username} className="text-[11px] font-black text-white uppercase">
                <td className="px-3 py-3 text-center text-white/20 font-createfuture">{i + 1}</td>
                <td className="px-3 py-3 font-createfuture pr-2 whitespace-nowrap overflow-visible">{s.username}</td>
                <td className="px-1.5 py-3 text-center text-white/70">{s.won}</td>
                <td className="px-1.5 py-3 text-center text-white/30">{s.lost}</td>
                <td className="px-1.5 py-3 text-center text-white/40">{s.draws || 0}</td>
                <td className="px-1.5 py-3 text-center text-[#E94560]/80 font-createfuture">{s.koPoints}</td>
                <td className="px-3 py-3 text-right text-primary font-createfuture text-sm">{s.points}</td>
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
    draws: 0,
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
          if (s1) { s1.draws++; s1.points += 1; }
          if (s2) { s2.draws++; s2.points += 1; }
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

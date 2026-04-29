import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from './Avatar';
import { RankBadge, getRankFromElo, getNextThreshold, RANK_TIERS } from './RankBadge';

export function BladerHeroCard({ blader }) {
  if (!blader) return null;
  
  const xpBase = Math.pow(blader.level - 1, 2) * 50;
  const xpNext = Math.pow(blader.level, 2) * 50;
  const progress = ((blader.xp - xpBase) / (xpNext - xpBase)) * 100;

  // ELO Ranking logic
  const { rank: rankObj, display, tier } = getRankFromElo(blader.elo || 1000, blader.placement_done);
  const rank = { display, tier }; // For easier access in JSX
  const { target: nextTarget, label: nextLabel } = getNextThreshold(blader.elo || 1000, blader.placement_done);
  
  // Progress within current division
  let eloProgress = 0;
  if (nextTarget && !(!blader.placement_done)) {
    const divFloor = nextTarget - 67;
    eloProgress = ((blader.elo - divFloor) / (nextTarget - divFloor)) * 100;
    eloProgress = Math.max(5, Math.min(100, eloProgress));
  }

  const isPlacement = !blader.placement_done;
  const placementProgress = Math.min(blader.elo_matches || 0, 5);

  // Use avatar_id first (user choice), then fallback to avatar_url (dicebear defaults)
  const currentAvatarId = blader.avatar_id || blader.avatar_url;

  return (
    <div className="mx-4 bg-[#11112B] border border-white/5 rounded-[28px] p-6 relative overflow-hidden shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)]">
       {/* High-tech glow effects */}
       <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-[#E94560]/10 blur-[60px] rounded-full pointer-events-none" />
       <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-[#4361EE]/10 blur-[60px] rounded-full pointer-events-none" />
       
       <div className="flex items-center gap-5 mb-8 relative z-10">
          <div className="relative">
             {/* Hex-ish rotating avatar container */}
             <div className="w-20 h-20 bg-gradient-to-br from-[#F5A623] to-[#FF7E5F] p-0.5 rounded-[24px] rotate-3 shadow-lg shadow-[#F5A623]/20">
                <div className="w-full h-full bg-[#0A0A1A] rounded-[22px] flex items-center justify-center p-0.5 -rotate-3 overflow-hidden">
                   <Avatar 
                    avatarId={currentAvatarId} 
                    username={blader.username} 
                    size={72} 
                   />
                </div>
             </div>
             {/* Floating Level Badge */}
             <div className="absolute -bottom-1.5 -right-1.5 bg-[#E94560] text-white text-[10px] font-black px-2.5 py-1 rounded-[10px] shadow-2xl border border-white/10 ring-4 ring-[#11112B]">
                LV {blader.level}
             </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-[#E94560] tracking-[0.2em] block uppercase animate-pulse">▲ BLADER</span>
              <RankBadge elo={blader.elo || 1000} placementDone={blader.placement_done} size="sm" showName={false} showElo={false} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">{blader.username}</h2>
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-2">{blader.status || "Blader d'Elite"}</p>
          </div>
       </div>

        {/* XP Section */}
        <div className="space-y-4 relative z-10">
           {/* XP Bar */}
           <div className="space-y-2">
              <div className="flex justify-between items-end">
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Progresso XP</span>
                 <span className="text-[10px] font-black text-white/80 tabular-nums">{blader.xp} <span className="text-white/20">/</span> {xpNext} CP</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} 
                   transition={{ duration: 1 }}
                   className="h-full bg-gradient-to-r from-[#4361EE] to-[#E94560] rounded-full" 
                 />
              </div>
           </div>

           {/* ELO Bar */}
           <div className="space-y-2 pt-1">
              <div className="flex justify-between items-end">
                 <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: isPlacement ? '#6B7280' : rank.tier.color }}>
                   {isPlacement ? 'Unranked' : `Ranking ${rank.display}`}
                 </span>
                 <span className="text-[10px] font-black text-white/80 tabular-nums">
                   {isPlacement ? placementProgress : blader.elo} <span className="text-white/20">/</span> {isPlacement ? '5' : (nextTarget ? nextTarget : 'MAX')} {isPlacement ? 'MATCH' : 'ELO'}
                 </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${isPlacement ? (placementProgress / 5) * 100 : eloProgress}%` }} 
                   transition={{ duration: 1 }}
                   style={{ background: isPlacement ? '#6B7280' : rank.tier.color }}
                   className="h-full rounded-full shadow-[0_0_8px_rgba(255,255,255,0.1)]" 
                 />
              </div>
              {isPlacement ? (
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-center mt-1">
                   Completa i Placement per sbloccare il Rank
                </p>
              ) : nextLabel ? (
                <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] text-center mt-1">
                   Verso {nextLabel}
                </p>
              ) : null}
           </div>
        </div>
    </div>
  );
}

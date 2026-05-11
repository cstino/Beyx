import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from './Avatar';
import { TrendingUp, Zap, Sparkles } from 'lucide-react';
import { RankBadge, getRankFromElo, getNextThreshold, RANK_TIERS, RANK_RANGES } from './RankBadge';

export function BladerHeroCard({ blader }) {
  if (!blader) return null;
  
  const xpBase = Math.pow(blader.level - 1, 2) * 50;
  const xpNext = Math.pow(blader.level, 2) * 50;
  const progress = ((blader.xp - xpBase) / (xpNext - xpBase)) * 100;

  // ELO Ranking logic
  const { display, tier } = getRankFromElo(blader.elo || 1000);
  const { target: nextTarget } = getNextThreshold(blader.elo || 1000);
  
  // Progress between current and next title
  let eloProgress = 0;
  if (nextTarget) {
    const currentRange = RANK_RANGES.find(r => blader.elo >= r.minElo);
    const floor = currentRange ? currentRange.minElo : 0;
    const range = nextTarget - floor;
    eloProgress = ((blader.elo - floor) / range) * 100;
    eloProgress = Math.max(5, Math.min(100, eloProgress));
  } else {
    eloProgress = 100; // God Blader
  }

  const currentAvatarId = blader.avatar_id || blader.avatar_url;

  return (
    <div className="mx-4 relative">
      {/* Dynamic Glow Background - Adjusted to avoid clipping */}
      <div 
        className="absolute -inset-2 rounded-[32px] blur-3xl opacity-20 pointer-events-none"
        style={{ background: tier.color }}
      />

      <div className="relative bg-[#0A0A1A] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
        {/* Pattern & Decor */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
           <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="relative z-10 p-5">
          {/* TOP SECTION: Name, Title & Avatar */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black text-white/40 tracking-[0.2em] uppercase">
                  BLADER PROFILE
                </div>
                <div className="flex gap-1">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className="w-1 h-1 rounded-full bg-white/10" />
                   ))}
                </div>
              </div>
              
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-1 font-createfuture">
                {blader.username}
              </h2>
              
              <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-white/5 border border-white/5 w-fit">
                <Sparkles size={10} style={{ color: tier.color }} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: tier.color }}>
                  {display}
                </span>
              </div>
            </div>

            {/* Compact Avatar in top right */}
            <div className="relative group/avatar">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 blur-xl opacity-30 rounded-full"
                 style={{ background: tier.color }}
               />
               <motion.div
                 whileHover={{ scale: 1.1 }}
                 className="relative z-10 rounded-2xl overflow-hidden border-2 border-white/10 shadow-xl"
               >
                 <Avatar avatarId={currentAvatarId} size={76} />
               </motion.div>
            </div>
          </div>

          {/* MAIN STATS SECTION: Gauges */}
          <div className="space-y-5">
            {/* POWER RATING (ELO) */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                 <div className="flex items-center gap-2">
                    <div className="w-1 h-3 rounded-full" style={{ background: tier.color }} />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/40">Power Rating</span>
                 </div>
                 <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white italic font-createfuture tracking-tighter" style={{ textShadow: `0 0 12px ${tier.color}44` }}>
                      {blader.elo || 1000}
                    </span>
                    <span className="text-[8px] font-black text-white/20 uppercase">ELO</span>
                 </div>
              </div>
              
              <div className="relative h-3.5 bg-white/[0.03] rounded-md p-0.5 border border-white/10 overflow-hidden">
                 <div className="absolute inset-0 flex gap-0.5 px-1 py-1 opacity-10">
                    {[...Array(15)].map((_, i) => (
                      <div key={i} className="flex-1 h-full bg-white/20 rounded-sm" />
                    ))}
                 </div>
                 
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${eloProgress}%` }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className="h-full rounded-sm relative z-10"
                   style={{ 
                     background: `linear-gradient(90deg, ${tier.color}66, ${tier.color})`,
                     boxShadow: `0 0 15px ${tier.color}44`
                   }}
                 >
                   <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-30" />
                   <motion.div 
                      animate={{ x: ['-100%', '300%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
                   />
                 </motion.div>
              </div>
              
              <div className="flex justify-between text-[7px] font-bold text-white/15 uppercase tracking-widest">
                 <span>START</span>
                 <span>NEXT TITLE AT: {nextTarget || 'MAX'}</span>
              </div>
            </div>

            {/* BATTLE XP */}
            <div className="py-2 border-t border-white/5">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-0.5">
                   <div className="flex items-center gap-2">
                      <Zap size={9} className="text-white/40" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Battle XP</span>
                   </div>
                   <div className="text-[9px] font-black text-white/40 italic">
                      LEVEL {blader.level}
                   </div>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${progress}%` }}
                     className="h-full bg-white/20 rounded-full"
                   />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative corner accent */}
        <div 
          className="absolute bottom-0 right-0 w-16 h-16 opacity-10 blur-2xl"
          style={{ background: tier.color }}
        />
      </div>
    </div>
  );
}

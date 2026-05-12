import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './Avatar';
import { Zap, Sparkles, Shield, Target, TrendingUp, ChevronRight, Globe, Swords } from 'lucide-react';
import { RankBadge, getRankFromElo, getNextThreshold, RANK_TIERS, RANK_RANGES } from './RankBadge';

export function BladerHeroCard({ blader }) {
  if (!blader) return null;
  
  const [displayElo, setDisplayElo] = useState(0);
  const targetElo = blader.elo || 1000;

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const end = targetElo;
      if (start === end) return;
      
      let totalMiliseconds = 1000;
      let incrementTime = (totalMiliseconds / end) * 5;
      
      let timer = setInterval(() => {
        start += 5;
        setDisplayElo(start);
        if (start >= end) {
          setDisplayElo(end);
          clearInterval(timer);
        }
      }, incrementTime);
    }, 500);
    return () => clearTimeout(timer);
  }, [targetElo]);



  const { display, tier } = getRankFromElo(targetElo);
  const RankIcon = tier.icon;
  const { target: nextTarget } = getNextThreshold(targetElo);
  const currentAvatarId = blader.avatar_id || blader.avatar_url;

  return (
    <div className="mx-4 relative group">
      {/* Background Ambience */}
      <div 
        className="absolute -inset-4 rounded-[40px] blur-[60px] opacity-10 transition-all duration-1000 group-hover:opacity-20"
        style={{ background: `radial-gradient(circle, ${tier.color} 0%, transparent 70%)` }}
      />

      <div className="relative bg-[#050510] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Futuristic Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        {/* Animated Scanning Line */}
        <motion.div 
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"
        />

        <div className="relative z-10 p-6">
          {/* HEADER SECTION */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 blur-lg opacity-40 rounded-2xl" style={{ background: tier.color }} />
                <div className="relative bg-[#0A0A1A] rounded-2xl p-0.5 border border-white/20">
                  <Avatar avatarId={currentAvatarId} size={64} />
                </div>
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[#050510] flex items-center justify-center text-[10px] font-black text-white shadow-lg"
                  style={{ background: tier.color }}
                >
                  {blader.level}
                </motion.div>
              </div>
              <div className="flex flex-col justify-center">
                 <h2 className="text-2xl font-black text-white italic leading-tight font-createfuture tracking-[0.05em]">
                   {blader.username}
                 </h2>
                <div 
                  className="flex items-center gap-2 py-1 px-3 rounded-xl border mt-1.5 w-fit shadow-md transition-all"
                  style={{ 
                    background: `${tier.color}15`, 
                    borderColor: `${tier.color}40`,
                    boxShadow: `0 0 12px -2px ${tier.color}30`
                  }}
                >
                  {RankIcon && <RankIcon size={13} style={{ color: tier.color }} strokeWidth={2.5} />}
                  <span 
                    className="text-[10px] font-black uppercase tracking-[0.15em] italic font-createfuture leading-none pt-0.5"
                    style={{ color: tier.color }}
                  >
                    {display}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BENTO GRID STATS */}
          <div className="flex flex-col gap-3">
            {/* ROW 1: POWER CORE (ELO) - FULL WIDTH */}
            <div className="relative group/core w-full">
               <div className="absolute inset-0 bg-white/[0.02] border border-white/10 rounded-3xl transition-all group-hover/core:border-white/20" />
               <div className="relative p-5 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Power Rating</span>
                    <TrendingUp size={12} className="text-white/10" />
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-white italic font-createfuture tracking-[0.02em] tabular-nums leading-none">
                      {displayElo}
                    </span>
                    <span className="text-xs font-black text-white/20 uppercase tracking-widest italic">ELO</span>
                  </div>

                  {/* Next Milestone Info */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-primary" />
                       <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Next Milestone</span>
                    </div>
                    <div className="text-[10px] font-black text-white italic">
                      {nextTarget ? nextTarget - targetElo : '0'} <span className="text-[8px] opacity-30 not-italic ml-0.5">PT TO GO</span>
                    </div>
                  </div>
               </div>
               
               {/* Decorative Tech Detail */}
               <div className="absolute top-0 right-0 p-2 opacity-10">
                 <div className="w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
               </div>
            </div>

            {/* ROW 2: 3 CARDS SIDE-BY-SIDE */}
            <div className="grid grid-cols-3 gap-3">
               {/* CARD XP */}
               <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-center items-center text-center">
                  <Zap size={14} className="text-primary mb-1.5" />
                  <div className="text-sm font-black text-white italic font-createfuture leading-none">{blader.xp}</div>
                  <div className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-1">Total XP</div>
               </div>
               {/* CARD GLOBAL RANK */}
               <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-center items-center text-center">
                  <Globe size={14} className="text-[#4361EE] mb-1.5" />
                  <div className="text-sm font-black text-white italic font-createfuture leading-none">{blader.rank || '--'}</div>
                  <div className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-1">Global</div>
               </div>
               {/* CARD W/L */}
               <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-center items-center text-center overflow-hidden">
                  <Swords size={14} className="text-[#10B981] mb-1.5" />
                  <div className="text-xs font-black text-white italic font-createfuture leading-none tracking-tight whitespace-nowrap">
                    {blader.wins || 0}W/{blader.losses || 0}L
                  </div>
                  <div className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-1">Record</div>
               </div>
            </div>
          </div>
        </div>
        
        {/* Subtle Bottom Accent */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${tier.color}44, transparent)` }} />
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, value, color, iconColor }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
      <Icon size={10} style={{ color: iconColor || 'white' }} />
      <span className="text-[8px] font-black text-white/60 tracking-widest">{value}</span>
    </div>
  );
}

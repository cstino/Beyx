import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from './Avatar';

export function BladerHeroCard({ blader }) {
  if (!blader) return null;
  
  const xpBase = Math.pow(blader.level - 1, 2) * 50;
  const xpNext = Math.pow(blader.level, 2) * 50;
  const progress = ((blader.xp - xpBase) / (xpNext - xpBase)) * 100;

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
            <span className="text-[10px] font-black text-[#E94560] tracking-[0.2em] block uppercase animate-pulse">▲ BLADER</span>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">{blader.username}</h2>
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-2">{blader.status || "Blader d'Elite"}</p>
          </div>
       </div>

       {/* XP Section */}
       <div className="space-y-3 relative z-10">
          <div className="flex justify-between items-end">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Progresso XP</span>
             <span className="text-xs font-black text-white/80 tabular-nums">{blader.xp} <span className="text-white/20">/</span> {xpNext} CP</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
             <motion.div 
               initial={{ width: 0 }} 
               animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} 
               transition={{ duration: 1, ease: "easeOut" }}
               className="h-full bg-gradient-to-r from-[#4361EE] via-[#9B5DE5] to-[#E94560] rounded-full" 
             />
          </div>
       </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar';
import { RankBadge } from './RankBadge';
import { Crown, Trophy, ChevronRight } from 'lucide-react';

export function LeaderboardCarousel({ bladers }) {
  const navigate = useNavigate();

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
           <div className="w-[3px] h-4 bg-[#F5A623]" />
           <h2 className="text-[11px] font-black text-white tracking-[0.2em] uppercase font-createfuture">Hall of Fame</h2>
        </div>
        <button 
          onClick={() => navigate('/leaderboard')}
          className="text-[9px] font-black text-[#F5A623] uppercase tracking-widest flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          TUTTE <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-6 snap-x">
        {(!bladers || bladers.length === 0) && (
          <div className="w-full py-10 text-center border border-dashed border-white/5 rounded-3xl opacity-20">
            <Trophy size={32} className="mx-auto mb-2" />
            <div className="text-[10px] font-black uppercase tracking-widest">Nessun dato disponibile</div>
          </div>
        )}
        {bladers && bladers.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(`/leaderboard`)}
            className="flex-shrink-0 w-[180px] snap-center p-5 rounded-[32px] bg-gradient-to-br from-[#1A1A3A] to-[#0A0A1A] border border-white/5 relative overflow-hidden group/card cursor-pointer shadow-xl"
          >
            {/* Rank Badge Floating */}
            <div className="absolute top-4 left-4 z-10">
               {i === 0 ? (
                 <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-glow-gold">
                    <Crown size={14} className="text-white" />
                 </div>
               ) : (
                 <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-[10px] font-black text-white/40 border border-white/10">
                    #{i + 1}
                 </div>
               )}
            </div>

            <div className="flex flex-col items-center text-center relative z-10">
               <div className="mb-4 relative">
                  <div className="absolute inset-0 bg-[#F5A623]/20 blur-xl rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  <Avatar avatarId={b.avatar_id} size={72} />
                  {i === 0 && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#F5A623] border-2 border-[#0A0A1A] flex items-center justify-center shadow-lg">
                       <Trophy size={12} className="text-white" />
                    </div>
                  )}
               </div>

               <div className="text-xs font-black text-white uppercase italic tracking-tighter mb-1 font-createfuture truncate w-full">
                 {b.username}
               </div>
               
               <div className="flex items-center justify-center gap-1 mb-3">
                  <RankBadge elo={b.elo || 1000} size="xs" showName={false} />
                  <span className="text-[10px] font-black text-white/30 tabular-nums">{b.elo || 1000}</span>
               </div>

               <div className="w-full py-1.5 rounded-xl bg-white/5 border border-white/5 text-[8px] font-black text-white/40 uppercase tracking-widest">
                  {b.elo_matches || 0} Match
               </div>
            </div>

            {/* Background Accent */}
            <div className="absolute bottom-[-20%] right-[-20%] w-24 h-24 bg-[#F5A623]/5 blur-[30px] rounded-full" />
          </motion.div>
        ))}
        
        {/* View All Card */}
        <motion.div
          onClick={() => navigate('/leaderboard')}
          className="flex-shrink-0 w-[140px] snap-center rounded-[32px] bg-white/5 border border-white/5 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/10 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 border border-white/10">
            <ChevronRight size={24} />
          </div>
          <div className="text-[9px] font-black text-white/40 uppercase tracking-widest text-center">Vedi<br/>Tutta</div>
        </motion.div>
      </div>
    </div>
  );
}

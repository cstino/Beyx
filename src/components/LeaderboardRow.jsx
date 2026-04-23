import React from 'react';

export function LeaderboardRow({ rank, blader }) {
  if (!blader) return null;

  return (
    <div className="bg-[#11112B] border border-white/5 rounded-[22px] p-4 flex items-center justify-between group active:bg-white/10 transition-all border-l-2 border-l-transparent hover:border-l-[#4361EE]/40">
       <div className="flex items-center gap-4">
          <span className={`text-[12px] font-black w-6 text-center ${rank === 1 ? 'text-[#F5A623]' : 'text-white/20'}`}>
             {rank.toString().padStart(2, '0')}
          </span>
          
          <div className="w-12 h-12 rounded-full border border-white/10 bg-[#0A0A1A] p-0.5 overflow-hidden transition-transform group-hover:scale-105">
             <img 
               src={blader.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${blader.username}`} 
               className="w-full h-full rounded-full object-cover" 
               alt={blader.username} 
             />
          </div>
          
          <div className="space-y-0.5">
            <h4 className="text-[14px] font-black uppercase text-white leading-tight tracking-tight">{blader.username}</h4>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
              {blader.wins || 0} WINS <span className="mx-1">•</span> LV {blader.level || 1}
            </p>
          </div>
       </div>
       
       <div className="text-right">
          <p className="text-[14px] font-black text-[#4361EE] leading-none mb-1 tracking-tighter">{blader.xp}</p>
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">XP</p>
       </div>
    </div>
  );
}

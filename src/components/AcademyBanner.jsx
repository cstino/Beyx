import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';

export function AcademyBanner({ onClick }) {
  return (
    <button 
      onClick={onClick} 
      className="w-full bg-[#11112B] border border-white/5 rounded-[24px] p-5 flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden"
    >
       {/* Background glow shadow */}
       <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#4361EE]/40" />
       
       <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#4361EE]/10 rounded-[20px] flex items-center justify-center border border-[#4361EE]/20 group-hover:scale-110 transition-transform duration-500">
             <BookOpen className="text-[#4361EE]" size={28} />
          </div>
          <div className="text-left">
             <h3 className="font-black uppercase text-lg tracking-tighter text-white leading-none mb-1.5">X Academy</h3>
             <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none">Impara le basi e domina l'arena</p>
          </div>
       </div>
       
       <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-white/10 group-hover:translate-x-1 transition-all">
          <ChevronRight size={18} className="text-white/40" />
       </div>
    </button>
  );
}

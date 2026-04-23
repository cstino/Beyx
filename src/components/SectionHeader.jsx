import React from 'react';

export function SectionHeader({ title, accentColor, onSeeAll }) {
  return (
    <div className="flex items-center justify-between mb-4 px-1">
       <div className="flex items-center gap-3">
          <div className="w-1 h-4 rounded-full" style={{ backgroundColor: accentColor }} />
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/90 leading-none">{title}</h2>
       </div>
       
       {onSeeAll && (
          <button 
            onClick={onSeeAll} 
            className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em] border-b border-transparent hover:border-white/20 hover:text-white/60 transition-all"
          >
             Vedi Tutti
          </button>
       )}
    </div>
  );
}

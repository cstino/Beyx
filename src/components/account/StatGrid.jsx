import React from 'react';
import { Trophy, Package, Wrench, TrendingUp } from 'lucide-react';

export function StatGrid({ stats }) {
  if (!stats) return (
    <div className="grid grid-cols-2 gap-3 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5" />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatTile label="Win Rate" value={`${stats.winRate}%`} sub={`${stats.wins}V / ${stats.losses}L`} icon={TrendingUp} color="#00D68F" />
      <StatTile label="Battaglie" value={stats.totalBattles} sub="Arene solcate"          icon={Trophy}     color="#F5A623" />
      <StatTile label="Parti"     value={stats.partsOwned}   sub="In Collezione"           icon={Package}    color="#4361EE" />
      <StatTile label="Combo"     value={stats.combosCount}  sub="Creati da te"            icon={Wrench}     color="#E94560" />
    </div>
  );
}

function StatTile({ label, value, sub, icon: Icon, color }) {
  return (
    <div
      className="bg-[#12122A] rounded-2xl p-4 relative overflow-hidden border border-white/5 group transition-all hover:border-white/15"
    >
      {/* Accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: color }} />
      
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="text-[10px] font-black tracking-[0.15em] opacity-40 uppercase">
          {label}
        </div>
        <Icon size={14} style={{ color }} strokeWidth={2.5} />
      </div>
      
      <div className="text-2xl font-black text-white leading-none tabular-nums relative z-10">
        {value}
      </div>
      
      <div className="text-[9px] text-white/30 mt-2 tracking-widest font-black uppercase relative z-10 leading-none">
        {sub}
      </div>

      {/* Decorative background icon */}
      <div className="absolute -bottom-2 -right-2 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
        <Icon size={64} style={{ color }} strokeWidth={2.5} />
      </div>
    </div>
  );
}

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export function AchievementsGrid({ achievements }) {
  if (!achievements || achievements.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-3 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {achievements.map((a, i) => {
        // Dynamically get the icon component from Lucide
        const IconComponent = LucideIcons[a.icon] || LucideIcons.Award;
        const unlocked = a.unlocked;

        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02, ease: "circOut" }}
            className="group relative"
          >
            <div
              className={`relative aspect-square rounded-2xl p-4 flex flex-col items-center justify-center text-center border-2 transition-all duration-500
                ${unlocked 
                  ? 'bg-white/[0.03] shadow-lg overflow-hidden' 
                  : 'bg-white/[0.01] border-white/5 grayscale opacity-40'}`}
              style={unlocked ? {
                borderColor: `${a.color}40`,
                boxShadow: `0 8px 30px -10px ${a.color}20`,
              } : undefined}
            >
              {/* Background gradient for unlocked */}
              {unlocked && (
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ background: `radial-gradient(circle at center, ${a.color} 0%, transparent 80%)` }}
                />
              )}

              {unlocked ? (
                <IconComponent size={26} style={{ color: a.color }} strokeWidth={2.5} className="relative z-10" />
              ) : (
                <Lock size={20} className="text-white/20 relative z-10" strokeWidth={2.5} />
              )}

              <div
                className={`text-[9px] font-black tracking-widest mt-3 uppercase leading-tight relative z-10 
                  ${unlocked ? 'text-white' : 'text-white/20'}`}
              >
                {a.name}
              </div>

              {/* Tooltip-like info on hover (optional enhancement) */}
              <div className="absolute inset-0 bg-[#0A0A1A] opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-center justify-center rounded-2xl z-20 pointer-events-none border border-white/10">
                <div className="text-[8px] font-black text-white/80 uppercase tracking-widest">
                  {a.description}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

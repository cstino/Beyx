import React, { useState } from 'react';
import { Zap, Shield, Target, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const typeConfig = {
  Attack: { color: 'text-accent bg-accent/10 border-accent/20', icon: Zap },
  Defense: { color: 'text-green-500 bg-green-500/10 border-green-500/20', icon: Shield },
  Stamina: { color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', icon: Star },
  Balance: { color: 'text-primary bg-primary/10 border-primary/20', icon: Target },
};

export default function PartImage({ src, name, type, className }) {
  const [error, setError] = useState(false);
  const config = typeConfig[type] || typeConfig.Balance;
  const Icon = config.icon;

  if (!src || error) {
    return (
      <div className={cn(
        "w-full h-full rounded-xl border flex flex-col items-center justify-center gap-3 relative overflow-hidden group",
        config.color,
        className
      )}>
        {/* Abstract SVG Background */}
        <svg className="absolute inset-0 w-full h-full opacity-10 group-hover:scale-110 transition-transform duration-700" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
          <path d="M50 10 L50 90 M10 50 L90 50" stroke="currentColor" strokeWidth="0.2" />
        </svg>
        
        <Icon size={40} className="relative z-10 drop-shadow-lg" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10 opacity-60">
          {type || 'No Data'}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full rounded-xl overflow-hidden bg-white/5", className)}>
      <img
        src={src}
        alt={name}
        onError={() => setError(true)}
        className="w-full h-full object-contain p-2 hover:scale-110 transition-transform duration-500"
      />
    </div>
  );
}

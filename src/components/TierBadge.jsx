import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const tierConfig = {
  S: 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.2)]',
  A: 'text-primary border-primary/50 bg-primary/10',
  B: 'text-purple-400 border-purple-500/50 bg-purple-500/10',
  C: 'text-slate-400 border-slate-500/50 bg-slate-500/10',
};

export default function TierBadge({ tier, className }) {
  const config = tierConfig[tier] || tierConfig.C;
  
  return (
    <div className={cn(
      "px-3 py-1 rounded-lg border-2 font-black text-xs inline-flex items-center justify-center uppercase tracking-tighter",
      config,
      className
    )}>
      {tier || 'C'} TIER
    </div>
  );
}

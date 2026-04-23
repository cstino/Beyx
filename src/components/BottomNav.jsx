import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, Hammer, Trophy, User } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: Home, label: 'HOME', path: '/' },
  { icon: LayoutGrid, label: 'COLLECT', path: '/collection' },
  { icon: Hammer, label: 'BUILDER', path: '/builder' },
  { icon: Trophy, label: 'BATTLE', path: '/battle' },
  { icon: User, label: 'ACCOUNT', path: '/account' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
      <div className="mx-auto max-w-lg glass-card flex items-center justify-around py-3 px-2">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-300 px-3 py-1 rounded-xl",
                isActive 
                  ? "text-primary scale-110 glow-text-primary" 
                  : "text-slate-400 hover:text-slate-200"
              )
            }
          >
            <Icon size={24} />
            <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

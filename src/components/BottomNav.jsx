import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, Layers, Trophy, User, FlaskConical } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: Home, label: 'HOME', path: '/' },
  { icon: LayoutGrid, label: 'COLLECT', path: '/collection' },
  { icon: Layers, label: 'DECK', path: '/builder' },
  { icon: Trophy, label: 'BATTLE', path: '/battle' },
  { icon: User, label: 'ACCOUNT', path: '/account' },
];

export default function BottomNav() {
  const modalOpen = useUIStore(s => s.modalOpen);
  const isAdmin = useAuthStore(s =>
    s.user?.email === 'cr.96bc@gmail.com'
    || s.user?.email === 'hcskso96@gmail.com'
    || s.profile?.is_admin
  );

  if (modalOpen) return null;

  const allItems = isAdmin
    ? [...navItems.slice(0, 4), { icon: FlaskConical, label: 'LAB', path: '/test-lab' }, navItems[4]]
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-2">
      <div className="mx-auto max-w-lg glass-card flex items-center justify-around py-3 px-2">
        {allItems.map(({ icon: Icon, label, path }) => (
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

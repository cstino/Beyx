import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { Logo } from './Logo';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen pb-24 bg-[#0A0A1A]">
      {/* Global Safe Header - Increased safety padding for Dynamic Island */}
      <header 
        className="px-6 flex items-center justify-between sticky top-0 z-50 bg-[#0A0A1A]/90 backdrop-blur-xl border-b border-white/5"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
          paddingBottom: '16px'
        }}
      >
        <Logo size="sm" />
        <div className="flex items-center gap-3">
           {/* Placeholder for future Profile/Notif icon */}
           <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
           </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-4xl mx-auto">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}

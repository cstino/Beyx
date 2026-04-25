import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { Logo } from './Logo';
import { useUIStore } from '../store/useUIStore';
import { ChevronLeft } from 'lucide-react';
import { ToastContainer } from './Toast';

export default function Layout() {
  const navigate = useNavigate();
  const { headerTitle, backPath } = useUIStore();

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-[#0A0A1A]">
      <ToastContainer />
      {/* Global Dynamic Header */}
      <header 
        className="px-6 flex items-center justify-between sticky top-0 z-50 bg-[#0A0A1A]/95 backdrop-blur-xl border-b border-white/5"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          paddingBottom: '12px'
        }}
      >
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          {backPath ? (
            <button 
              onClick={() => navigate(backPath)} 
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5 active:scale-90 transition-all flex-shrink-0"
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <Logo size="sm" />
          )}

          {headerTitle && (
            <div className="flex-1 min-w-0">
               <h1 className="text-sm font-black text-white italic uppercase tracking-tight truncate">
                  {headerTitle}
               </h1>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
           {/* Dynamic dot/status */}
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

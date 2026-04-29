import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { Logo } from './Logo';
import { useUIStore } from '../store/useUIStore';
import { ChevronLeft } from 'lucide-react';
import { ToastContainer } from './Toast';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { headerTitle, backPath, backAction } = useUIStore();

  const getFallbackTitle = (path) => {
    if (path === '/') return 'HOME';
    if (path.startsWith('/collection')) return 'COLLECTION';
    if (path.startsWith('/builder')) return 'BUILDER';
    if (path.startsWith('/battle')) return 'BATTLE';
    if (path.startsWith('/account')) return 'ACCOUNT';
    if (path.startsWith('/academy')) return 'X ACADEMY';
    return '';
  };

  const displayTitle = headerTitle || getFallbackTitle(location.pathname);

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
        {/* Left: Back Button or Empty Space */}
        <div className="flex-1 flex justify-start">
          {(backPath || backAction) && (
            <button 
              onClick={() => backAction ? backAction() : navigate(backPath)} 
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5 active:scale-90 transition-all flex-shrink-0"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        {/* Center: Title */}
        <div className="flex-[2] flex justify-center items-center overflow-hidden px-2">
          {displayTitle && (
            <h1 className="text-[13px] font-black text-white uppercase tracking-wider truncate">
              {displayTitle}
            </h1>
          )}
        </div>

        {/* Right: Logo */}
        <div className="flex-1 flex justify-end">
          <Logo size="sm" spin={true} />
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-4xl mx-auto">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}

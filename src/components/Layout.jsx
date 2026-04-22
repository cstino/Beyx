import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header opzionale */}
      <header className="p-6">
        <h1 className="text-2xl font-display font-extrabold tracking-tighter italic">
          BEY<span className="text-primary italic">MANAGER</span><span className="text-accent underline decoration-2 underline-offset-4">X</span>
        </h1>
      </header>
      
      <main className="flex-1 px-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}

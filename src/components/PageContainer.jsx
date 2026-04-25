import React from 'react';

export function PageContainer({ children, className = '' }) {
  return (
    <div
      className={`min-h-screen bg-[#0A0A1A] pb-24 ${className}`}
      style={{ 
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
      }}
    >
      {children}
    </div>
  );
}

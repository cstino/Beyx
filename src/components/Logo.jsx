import React from 'react';

export function Logo({ size = 'md' }) {
  const heightClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10'
  };

  return (
    <div className="flex items-center">
      <img 
        src="/logo_beyx.png" 
        alt="BeyManager X" 
        className={`${heightClasses[size]} w-auto object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]`} 
        onError={(e) => {
          e.target.onerror = null;
          // Fallback if logo.png is missing or broken
          e.target.style.display = 'none';
        }}
      />
      {/* Fallback text if image fails */}
      <span className="sr-only">BeyManager X</span>
    </div>
  );
}

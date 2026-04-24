import React from 'react';

export function Logo({ size = 'md', className = '' }) {
  // Ultra-visible height classes
  const heightClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-40', // majestic size for auth/loading
  };

  const finalClassName = className || `${heightClasses[size]} w-auto`;

  return (
    <div className="inline-flex items-center justify-center">
      <img 
        src="/logo_beyx.png" 
        alt="BeyManager X" 
        className={`${finalClassName} object-contain transition-transform duration-700 hover:scale-105`}
        style={{
           filter: 'drop-shadow(0 0 25px rgba(233,69,96,0.6))'
        }}
        onError={(e) => {
          console.error("Logo failed to load from /logo_beyx.png");
          // Re-try with public/logo_beyx.png just in case (though Vite handles /)
        }}
      />
      <span className="sr-only">BeyManager X</span>
    </div>
  );
}

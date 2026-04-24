import React from 'react';

export function Logo({ size = 'md', className = '' }) {
  // Predefined height classes for standard header use
  const heightClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-24', // hero size for auth/loading
  };

  const finalClassName = className || `${heightClasses[size]} w-auto`;

  return (
    <div className="inline-flex items-center justify-center">
      <img 
        src="/logo_beyx.png" 
        alt="BeyManager X" 
        className={`${finalClassName} object-contain transition-transform duration-500`}
        style={{
           filter: 'drop-shadow(0 0 15px rgba(233,69,96,0.5))'
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
        }}
      />
      <span className="sr-only">BeyManager X</span>
    </div>
  );
}

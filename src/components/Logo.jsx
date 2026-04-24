import React from 'react';

export function Logo({ size = 'md', className = '' }) {
  // Ultra-visible height classes for consistency
  const heightClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-40', // majestic size for auth/loading
  };

  const finalClassName = className || `${heightClasses[size]} w-auto`;

  return (
    <div className={`inline-flex items-center justify-center ${finalClassName} transition-transform duration-700 hover:scale-105`}>
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full"
        style={{
          filter: 'drop-shadow(0 0 20px rgba(233,69,96,0.6))'
        }}
      >
        {/* Main Red X Shape (trapezoidal arms) */}
        <path
          d="M40,40 L90,90 L90,110 L40,160 L20,160 L20,40 Z"
          fill="#E94560"
        />
        <path
          d="M160,40 L110,90 L90,90 L90,110 L110,110 L160,160 L180,160 L180,40 Z"
          fill="#E94560"
        />
        <path
          d="M40,40 L160,40 L110,90 L90,90 Z"
          fill="#E94560"
        />
        <path
          d="M40,160 L160,160 L110,110 L90,110 Z"
          fill="#E94560"
        />

        {/* Central Star/Cross details from the logo */}
        <polygon
          points="100,85 115,100 100,115 85,100"
          fill="white"
        />
        <path d="M100,70 L108,85 L100,100 L92,85 Z" fill="white" />
        <path d="M130,100 L115,92 L100,100 L115,108 Z" fill="white" />
        <path d="M100,130 L92,115 L100,100 L108,115 Z" fill="white" />
        <path d="M70,100 L85,108 L100,100 L85,92 Z" fill="white" />

        {/* Dynamic inner stroke for depth */}
        <path
          d="M50,50 L95,95 M105,95 L150,50 M150,150 L105,105 M95,105 L50,150"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <span className="sr-only">BeyManager X</span>
    </div>
  );
}

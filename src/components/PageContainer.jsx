import React from 'react';

export function PageContainer({ children, className = '' }) {
  return (
    <div
      className={`min-h-screen pb-24 ${className}`}
    >
      {children}
    </div>
  );
}

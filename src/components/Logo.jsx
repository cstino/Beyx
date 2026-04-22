import React from 'react';
import { motion } from 'framer-motion';

/**
 * BeyManager X - Pure SVG Logo
 * Transparent, scalable, and premium neon style
 */
export default function Logo({ className }) {
  return (
    <svg 
      viewBox="0 0 400 400" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Outer Gear Glow */}
      <circle cx="200" cy="200" r="140" stroke="#3B82F6" strokeWidth="2" strokeDasharray="10 20" opacity="0.3" />
      
      {/* Gear Teeth */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <path 
          d="M200 60 L215 30 L245 40 L240 70 M280 80 L310 65 L330 95 L300 110 M340 160 L370 165 L360 195 L330 190 M300 290 L330 305 L310 335 L280 320 M200 340 L185 370 L155 360 L160 330 M120 320 L90 335 L70 305 L100 290 M60 240 L30 235 L40 205 L70 210 M100 110 L70 95 L90 65 L120 80" 
          stroke="#3B82F6" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </motion.g>

      {/* Central X stylized */}
      <path 
        d="M100 100 L300 300 M300 100 L100 300" 
        stroke="#F43F5E" 
        strokeWidth="24" 
        strokeLinecap="square"
        className="drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]"
      />
      <path 
        d="M110 110 L290 290 M290 110 L110 290" 
        stroke="white" 
        strokeWidth="4" 
        strokeLinecap="round"
      />

      {/* Inner Glow */}
      <circle cx="200" cy="200" r="40" fill="#3B82F6" fillOpacity="0.1" />
    </svg>
  );
}

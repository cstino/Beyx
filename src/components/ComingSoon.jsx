import React from 'react';
import { motion } from 'framer-motion';

export function ComingSoon({ icon: Icon, title, description, accentColor = '#E94560' }) {
  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-32 px-6 flex flex-col items-center justify-center">
      {/* Animated icon container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mb-6"
      >
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-2xl blur-3xl opacity-30"
          style={{ background: accentColor }}
        />
        <div
          className="relative w-24 h-24 rounded-[32px] flex items-center justify-center border shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)`,
            borderColor: `${accentColor}30`,
          }}
        >
          <Icon size={44} style={{ color: accentColor }} strokeWidth={2} />
        </div>
      </motion.div>

      {/* Badge */}
      <div
        className="text-[10px] font-black tracking-[0.2em] mb-4 px-4 py-1.5 rounded-full border"
        style={{
          color: accentColor,
          background: `${accentColor}10`,
          borderColor: `${accentColor}20`,
        }}
      >
        PROSSIMAMENTE
      </div>

      {/* Title */}
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-3 text-center leading-none">
        {title}
      </h2>

      {/* Description */}
      <p className="text-slate-400 text-sm text-center max-w-xs leading-relaxed font-medium">
        {description}
      </p>

      {/* Subtle animated loader dots */}
      <div className="flex gap-2 mt-10">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: accentColor }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}

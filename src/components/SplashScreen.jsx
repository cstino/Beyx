import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = [
  { key: 'logo',   duration: 1800 },  // Logo appears + holds
  { key: '3',      duration: 800 },
  { key: '2',      duration: 800 },
  { key: '1',      duration: 800 },
  { key: 'go',     duration: 1200 },   // GO SHOOT! holds longer
  { key: 'exit',   duration: 600 },    // Fade out
];

export function SplashScreen({ onComplete }) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (phaseIndex >= PHASES.length) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setPhaseIndex(prev => prev + 1);
    }, PHASES[phaseIndex].duration);

    return () => clearTimeout(timer);
  }, [phaseIndex, onComplete]);

  const currentPhase = PHASES[phaseIndex]?.key;

  // After all phases, render nothing (App takes over)
  if (phaseIndex >= PHASES.length) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: '#0A0A1A' }}
      animate={currentPhase === 'exit' ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background pulse ring — appears during countdown */}
      {['3', '2', '1', 'go'].includes(currentPhase) && (
        <motion.div
          key={`ring-${currentPhase}`}
          className="absolute rounded-full border-2"
          style={{
            borderColor: currentPhase === 'go' ? '#E94560' : '#4361EE',
          }}
          initial={{ width: 80, height: 80, opacity: 0.6 }}
          animate={{ width: 600, height: 600, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}

      {/* Subtle radial glow behind content */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full blur-[120px] opacity-20"
        style={{
          background: currentPhase === 'go'
            ? 'radial-gradient(circle, #E94560, transparent)'
            : 'radial-gradient(circle, #4361EE, transparent)',
          transition: 'background 0.3s',
        }}
      />

      <AnimatePresence mode="wait">
        {/* ─── LOGO PHASE ─── */}
        {currentPhase === 'logo' && (
          <motion.div
            key="logo"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            exit={{ opacity: 0, scale: 0.9, y: -30, transition: { duration: 0.3 } }}
          >
            <img
              src="/beyx.svg"
              alt="BeyManager X"
              className="w-48 h-auto drop-shadow-2xl"
            />

            {/* Subtle tagline under the logo */}
            <motion.div
              className="text-[10px] font-extrabold tracking-[0.3em] text-white/30 uppercase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Collection &bull; Build &bull; Battle
            </motion.div>
          </motion.div>
        )}

        {/* ─── COUNTDOWN NUMBERS ─── */}
        {['3', '2', '1'].includes(currentPhase) && (
          <motion.div
            key={`num-${currentPhase}`}
            className="relative"
            initial={{ opacity: 0, scale: 3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          >
            {/* Number */}
            <span
              className="text-[120px] font-black tabular-nums leading-none select-none"
              style={{
                fontFamily: "'CreateFuture', sans-serif",
                color: 'transparent',
                WebkitTextStroke: '3px #4361EE',
                filter: 'drop-shadow(0 0 30px rgba(67,97,238,0.6))',
              }}
            >
              {currentPhase}
            </span>

            {/* Solid fill layered on top for depth */}
            <span
              className="absolute inset-0 flex items-center justify-center
                text-[120px] font-black tabular-nums leading-none select-none"
              style={{
                fontFamily: "'CreateFuture', sans-serif",
                background: 'linear-gradient(180deg, #FFFFFF 0%, #4361EE 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {currentPhase}
            </span>
          </motion.div>
        )}

        {/* ─── GO SHOOT! ─── */}
        {currentPhase === 'go' && (
          <motion.div
            key="go"
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 2.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 12,
              stiffness: 200,
            }}
          >
            {/* GO text */}
            <motion.div
              className="text-[72px] font-black leading-none uppercase select-none tracking-tight"
              style={{
                fontFamily: "'CreateFuture', sans-serif",
                background: 'linear-gradient(135deg, #E94560 0%, #FF6B85 50%, #F5A623 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 40px rgba(233,69,96,0.8))',
              }}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: 1,
                ease: 'easeInOut',
              }}
            >
              GO
            </motion.div>

            {/* SHOOT! text */}
            <motion.div
              className="text-[48px] font-black leading-none uppercase select-none tracking-[0.1em]"
              style={{
                fontFamily: "'CreateFuture', sans-serif",
                color: '#FFFFFF',
                textShadow: '0 0 30px rgba(233,69,96,0.6), 0 0 60px rgba(233,69,96,0.3)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              SHOOT!
            </motion.div>

            {/* Accent line under SHOOT */}
            <motion.div
              className="h-1 rounded-full"
              style={{ background: 'linear-gradient(90deg, #E94560, #F5A623)' }}
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom accent line — always visible, pulses with countdown */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{
          background: currentPhase === 'go'
            ? 'linear-gradient(90deg, transparent, #E94560, transparent)'
            : 'linear-gradient(90deg, transparent, #4361EE, transparent)',
          transition: 'background 0.3s',
        }}
        animate={{
          opacity: ['3', '2', '1', 'go'].includes(currentPhase) ? [0.3, 1, 0.3] : 0.15,
        }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />

      {/* Tap to Skip */}
      {phaseIndex >= 1 && (
        <motion.button
          onClick={() => {
            setPhaseIndex(PHASES.length);
            onComplete();
          }}
          className="absolute bottom-12 text-white/20 text-[10px] font-bold
            tracking-[0.2em] uppercase cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          TOCCA PER SALTARE
        </motion.button>
      )}
    </motion.div>
  );
}

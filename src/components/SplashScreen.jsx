import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = [
  { key: 'logo',   duration: 2200 },  // Logo visibile per un tempo ragionevole
  { key: 'exit',   duration: 600 },    // Dissolvenza finale
];

export function SplashScreen({ onComplete }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // 1. Sblocca l'avvio dei timer solo quando la PWA iOS passa effettivamente in primo piano visibile
  useEffect(() => {
    let timeoutId;
    
    const start = () => {
      setIsReady(true);
      if (timeoutId) clearTimeout(timeoutId);
    };

    const handleReady = () => {
      if (document.visibilityState === 'visible') {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(start).catch(start);
        } else {
          start();
        }
      }
    };

    timeoutId = setTimeout(start, 2500);
    handleReady();
    document.addEventListener('visibilitychange', handleReady);
    
    return () => {
      document.removeEventListener('visibilitychange', handleReady);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // 2. Avanzamento fasi
  useEffect(() => {
    if (!isReady) return;

    if (phaseIndex >= PHASES.length) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setPhaseIndex(prev => prev + 1);
    }, PHASES[phaseIndex].duration);

    return () => clearTimeout(timer);
  }, [isReady, phaseIndex, onComplete]);

  const currentPhase = PHASES[phaseIndex]?.key;

  if (phaseIndex >= PHASES.length) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: '#0A0A1A' }}
      animate={currentPhase === 'exit' ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle radial glow behind logo */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full blur-[120px] opacity-20"
        style={{
          background: 'radial-gradient(circle, #4361EE, transparent)',
        }}
      />

      <AnimatePresence mode="wait">
        {currentPhase === 'logo' && (
          <motion.div
            key="logo"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.4 } }}
          >
            <img
              src="/beyx.svg"
              alt="BeyManager X"
              className="w-48 h-auto drop-shadow-2xl"
            />

            <motion.div
              className="text-[10px] font-extrabold tracking-[0.3em] text-white/40 uppercase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Collection &bull; Build &bull; Battle
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, #4361EE, transparent)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
      />
    </motion.div>
  );
}

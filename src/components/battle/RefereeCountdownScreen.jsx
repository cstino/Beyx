import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function RefereeCountdownScreen({ onComplete }) {
  const [phase, setPhase] = useState('ready'); // 'ready', '3', '2', '1', 'go'

  useEffect(() => {
    // 1. Setup Audio Context once
    let audioCtx = null;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("AudioContext not supported");
    }

    const playBeep = (time, freq = 440, duration = 0.3) => {
      if (!audioCtx) return;
      
      const startTime = audioCtx.currentTime + time;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const mainGain = audioCtx.createGain();
      
      // Circuito di Eco
      const delay = audioCtx.createDelay();
      const feedback = audioCtx.createGain();
      delay.delayTime.value = 0.15;
      feedback.gain.value = 0.25;
      
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(audioCtx.destination);
      
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq / 2, startTime);
      
      mainGain.gain.setValueAtTime(0, startTime);
      mainGain.gain.linearRampToValueAtTime(0.12, startTime + 0.01);
      mainGain.gain.setValueAtTime(0.12, startTime + duration - 0.05);
      mainGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc1.connect(mainGain);
      osc2.connect(mainGain);
      mainGain.connect(audioCtx.destination);
      mainGain.connect(delay);
      
      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    };

    // 2. Avvia la traccia vocale iniziale "Are you ready?"
    const readyAudio = new Audio('/assets/rurdy.mp3');
    readyAudio.play().catch(e => console.error("Errore riproduzione rurdy:", e));

    let countAudio = null;

    // Sincronizzazione:
    // 0s - 3s: ARE YOU READY?
    const t3 = setTimeout(() => {
      setPhase('3');
      countAudio = new Audio('/assets/321GO.mp3');
      countAudio.play().catch(e => console.error("Errore riproduzione 321GO:", e));
      
      // Scheduliamo tutti i beep in un colpo solo per massima precisione
      if (audioCtx) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playBeep(0, 440, 0.3);      // Per il "3" (ora)
        playBeep(1.0, 440, 0.3);    // Per il "2" (tra 1s)
        playBeep(2.0, 440, 0.3);    // Per il "1" (tra 2s)
        playBeep(3.0, 880, 0.7);    // Per il "GO" (tra 3s)
      }
    }, 3000);

    // Gestione fasi UI (devono restare con setTimeout per animazioni React)
    const t2 = setTimeout(() => setPhase('2'), 4000);
    const t1 = setTimeout(() => setPhase('1'), 5000);
    const tGo = setTimeout(() => setPhase('go'), 6000);
    const tDone = setTimeout(() => onComplete(), 8500);

    return () => {
      clearTimeout(t3);
      clearTimeout(t2);
      clearTimeout(t1);
      clearTimeout(tGo);
      clearTimeout(tDone);
      readyAudio.pause();
      if (countAudio) countAudio.pause();
      if (audioCtx) audioCtx.close();
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden select-none"
      style={{ background: '#0A0A1A' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background pulse ring — appare durante i numeri */}
      {['3', '2', '1', 'go'].includes(phase) && (
        <motion.div
          key={`ring-${phase}`}
          className="absolute rounded-full border-2"
          style={{
            borderColor: phase === 'go' ? '#E94560' : '#4361EE',
          }}
          initial={{ width: 100, height: 100, opacity: 0.8 }}
          animate={{ width: 800, height: 800, opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      )}

      {/* Bagliore radiale di fondo */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-[140px] opacity-25"
        style={{
          background: phase === 'go' || phase === 'ready'
            ? 'radial-gradient(circle, #E94560, transparent)'
            : 'radial-gradient(circle, #4361EE, transparent)',
          transition: 'background 0.3s',
        }}
      />

      <AnimatePresence mode="wait">
        {/* ─── ARE YOU READY PHASE ─── */}
        {phase === 'ready' && (
          <motion.div
            key="ready"
            className="flex flex-col items-center gap-4 px-4 text-center z-10"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.2 } }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div 
              className="text-xs font-black tracking-[0.6em] text-primary uppercase"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Preparazione Lancio
            </motion.div>
            <motion.div
              className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter"
              style={{
                fontFamily: "'CreateFuture', sans-serif",
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E94560 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              animate={{ 
                scale: [1, 1.08, 1],
                filter: [
                  'drop-shadow(0 0 20px rgba(233,69,96,0.4))', 
                  'drop-shadow(0 0 60px rgba(233,69,96,0.95))', 
                  'drop-shadow(0 0 20px rgba(233,69,96,0.4))'
                ]
              }}
              transition={{ 
                duration: 0.75, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              ARE YOU READY?
            </motion.div>
          </motion.div>
        )}

        {/* ─── NUMBERS PHASE ─── */}
        {['3', '2', '1'].includes(phase) && (
          <motion.div
            key={`num-${phase}`}
            className="relative flex items-center justify-center z-10"
            initial={{ opacity: 0, scale: 3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          >
            {/* Contorno in ombra */}
            <span
              className="text-[140px] sm:text-[200px] font-black tabular-nums leading-none"
              style={{
                fontFamily: "'CreateFuture', sans-serif",
                color: 'transparent',
                WebkitTextStroke: '4px #4361EE',
                filter: 'drop-shadow(0 0 40px rgba(67,97,238,0.8))',
              }}
            >
              {phase}
            </span>

            {/* Riempimento sfumato sovrapposto */}
            <span
              className="absolute inset-0 flex items-center justify-center
                text-[140px] sm:text-[200px] font-black tabular-nums leading-none"
              style={{
                fontFamily: "'CreateFuture', sans-serif",
                background: 'linear-gradient(180deg, #FFFFFF 0%, #4361EE 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {phase}
            </span>
          </motion.div>
        )}

        {/* ─── GO SHOOT PHASE ─── */}
        {phase === 'go' && (
          <motion.div
            key="go"
            className="flex flex-col items-center gap-2 z-10"
            initial={{ opacity: 0, scale: 2.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          >
            <motion.div
              className="text-[90px] sm:text-[130px] font-black leading-none uppercase tracking-tight"
              style={{
                fontFamily: "'CreateFuture', sans-serif",
                background: 'linear-gradient(135deg, #E94560 0%, #FF6B85 50%, #F5A623 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 50px rgba(233,69,96,0.9))',
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.6, repeat: 1, ease: 'easeInOut' }}
            >
              GO
            </motion.div>

            <motion.div
              className="text-5xl sm:text-7xl font-black leading-none uppercase tracking-[0.1em]"
              style={{
                fontFamily: "'CreateFuture', sans-serif",
                color: '#FFFFFF',
                textShadow: '0 0 30px rgba(233,69,96,0.8), 0 0 60px rgba(233,69,96,0.4)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              SHOOT!
            </motion.div>

            <motion.div
              className="h-1.5 rounded-full mt-2"
              style={{ background: 'linear-gradient(90deg, #E94560, #F5A623)' }}
              initial={{ width: 0 }}
              animate={{ width: 160 }}
              transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsante per interrompere o saltare l'animazione e tornare alla gestione del match */}
      <button
        onClick={onComplete}
        className="absolute bottom-12 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all z-20"
      >
        Torna al Match
      </button>
    </motion.div>
  );
}

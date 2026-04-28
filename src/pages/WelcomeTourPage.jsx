import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, Wrench, Swords, GraduationCap, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';

const SLIDES = [
  {
    icon: Package,
    color: '#4361EE',
    title: 'Colleziona',
    subtitle: 'Tieni traccia delle tue parti',
    description: 'Aggiungi alla collezione tutti i tuoi Blade, Ratchet e Bit. Vedi le statistiche, il peso reale e il tier di ogni parte.',
    bgGlow: 'rgba(67,97,238,0.15)',
  },
  {
    icon: Wrench,
    color: '#E94560',
    title: 'Costruisci',
    subtitle: 'Crea combo vincenti',
    description: 'Combina le tue parti per trovare la combo perfetta. Il Builder calcola automaticamente score, matchup e peso totale.',
    bgGlow: 'rgba(233,69,96,0.15)',
  },
  {
    icon: Swords,
    color: '#F5A623',
    title: 'Combatti',
    subtitle: 'Registra i tuoi match',
    description: 'Tieni il punteggio delle tue sfide 1v1, 3v3 o tornei ufficiali. Scala la classifica ELO e diventa un pro.',
    bgGlow: 'rgba(245,166,35,0.15)',
  },
  {
    icon: GraduationCap,
    color: '#00D68F',
    title: 'Impara',
    subtitle: 'X Academy',
    description: 'Accedi a lezioni esclusive per padroneggiare il meta, le tecniche di lancio e la manutenzione dei tuoi Bey.',
    bgGlow: 'rgba(0,214,143,0.15)',
  },
];

export function WelcomeTourPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const { profile, fetchProfile } = useAuthStore();
  const [isFinishing, setIsFinishing] = useState(false);

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  async function handleFinish() {
    if (isFinishing) return;
    setIsFinishing(true);

    try {
      // Segna l'onboarding come completato nel DB
      if (profile?.id) {
        await supabase
          .from('profiles')
          .update({ onboarding_done: true })
          .eq('id', profile.id);
        
        // Aggiorna lo store locale
        await fetchProfile(profile.id);
      }
      
      // La navigazione avverrà automaticamente grazie ad App.jsx
      // ma forziamo per sicurezza dopo un piccolo delay
      setTimeout(() => navigate('/'), 500);
    } catch (err) {
      console.error(err);
      setIsFinishing(false);
    }
  }

  function nextSlide() {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentSlide(s => s + 1);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] flex flex-col text-white relative overflow-hidden">
      {/* Background Glow Dinamico */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 -z-10"
          style={{ 
            background: `radial-gradient(circle at 50% 40%, ${slide.bgGlow} 0%, transparent 70%)` 
          }}
        />
      </AnimatePresence>

      {/* Skip Button */}
      <div className="px-6 pt-12 flex justify-end">
        {!isLast && (
          <button 
            onClick={handleFinish}
            className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            Salta Tour
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="flex flex-col items-center"
          >
            {/* Icon Circle */}
            <div 
              className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-10 relative"
              style={{ backgroundColor: `${slide.color}15`, border: `1px solid ${slide.color}30` }}
            >
              <slide.icon size={56} style={{ color: slide.color }} />
              {/* Outer rings */}
              <div className="absolute inset-[-12px] border border-white/5 rounded-[3rem] opacity-50" />
              <div className="absolute inset-[-24px] border border-white/5 rounded-[3.5rem] opacity-20" />
            </div>

            <h2 
              className="text-4xl font-black uppercase tracking-tighter italic mb-2"
              style={{ color: slide.color }}
            >
              {slide.title}
            </h2>
            <p className="text-white font-bold text-lg mb-4 italic tracking-tight">
              {slide.subtitle}
            </p>
            <p className="text-white/40 text-sm leading-relaxed max-w-[280px]">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="px-8 pb-16">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-10">
          {SLIDES.map((_, i) => (
            <div 
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-8' : 'w-1.5 bg-white/10'
              }`}
              style={{ backgroundColor: i === currentSlide ? slide.color : undefined }}
            />
          ))}
        </div>

        {/* Action Button */}
        <motion.button
          onClick={nextSlide}
          whileTap={{ scale: 0.97 }}
          className="w-full py-5 rounded-2xl font-black tracking-[0.2em] text-[#0A0A1A] flex items-center justify-center gap-3 shadow-2xl transition-all uppercase text-xs"
          style={{ 
            backgroundColor: slide.color,
            boxShadow: `0 10px 40px -10px ${slide.color}60`
          }}
        >
          {isLast ? (
             <>
               <Sparkles size={18} />
               <span>Inizia Ora</span>
             </>
          ) : (
            <>
              <span>Continua</span>
              <ChevronRight size={18} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

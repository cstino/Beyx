import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, TrendingUp, AlertTriangle, Zap, Shield, Star, Target } from 'lucide-react';
import StatRadar from './StatRadar';
import PartImage from './PartImage';

const statColors = {
  attack: '#ef4444',
  defense: '#3b82f6',
  stamina: '#22c55e',
  burst: '#eab308',
  mobility: '#a855f7'
};

const getAssessment = (score) => {
  if (score.overall > 80) return { text: "Combo Leggendaria! Perfettamente bilanciata e letale.", icon: Star, color: "text-yellow-400" };
  if (score.dominant === 'Attack' && score.breakdown.attack > 70) return { text: "Stile Offensivo estremo. Punta al colpo critico subito!", icon: Zap, color: "text-accent" };
  if (score.dominant === 'Defense' && score.breakdown.defense > 70) return { text: "Un muro invalicabile. Resisti ad ogni impatto.", icon: Shield, color: "text-blue-400" };
  if (score.dominant === 'Stamina' && score.breakdown.stamina > 70) return { text: "Energia infinita. Domina il centro dell'arena.", icon: Target, color: "text-green-400" };
  return { text: "Combo equilibrata, versatile per ogni situazione.", icon: TrendingUp, color: "text-primary" };
};

export default function ComboResultDrawer({ combo, score, onClose, onSave, saving }) {
  if (!combo.blade || !combo.ratchet || !combo.bit || !score) return null;

  const assessment = getAssessment(score);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="w-full max-w-sm bg-slate-900/90 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Scrollable Content */}
          <div className="overflow-y-auto p-6 space-y-6 scrollbar-hide">
            
            {/* Close */}
            <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-white/10 rounded-full backdrop-blur-md">
              <X size={18} className="text-white" />
            </button>

            {/* Visual Hero Section */}
            <div className="relative pt-4 flex flex-col items-center">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/20 blur-[60px] rounded-full" />
               
               <div className="flex items-center gap-4 w-full px-2">
                  <div className="w-24 h-24 relative flex-shrink-0">
                    <PartImage src={combo.blade.image_url} alt={combo.blade.name} className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-4xl font-black tracking-tighter leading-none mb-1">{score.overall}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest rounded-md border border-primary/20">
                        {score.dominant}
                      </span>
                    </div>
                  </div>
               </div>

               <h2 className="w-full text-center mt-6 text-xl font-black uppercase tracking-tighter">
                  {combo.blade.name} <span className="text-slate-500 font-bold">{combo.ratchet.name}{combo.bit.name}</span>
               </h2>
            </div>

            {/* Radar Center */}
            <div className="bg-white/5 rounded-[32px] p-4 flex items-center justify-center border border-white/10 relative">
               <StatRadar stats={score.breakdown} size={200} color={statColors[score.dominant.toLowerCase()]} />
            </div>

            {/* Assessment Card */}
            <div className="bg-white/5 rounded-[24px] p-4 border border-white/5 flex items-start gap-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${assessment.color}`}>
                <assessment.icon size={22} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Valutazione Sinergia</span>
                <p className="text-sm font-medium text-slate-200 mt-0.5 leading-snug">{assessment.text}</p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              {['attack', 'defense', 'stamina'].map(s => (
                <div key={s} className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                  <span className="text-[7px] uppercase font-black text-slate-500 block mb-0.5">{s}</span>
                  <span className="text-sm font-extrabold" style={{ color: statColors[s] }}>{score.breakdown[s]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Persistent Footer Action - Increased padding to clear navbar */}
          <div className="p-4 bg-slate-900 border-t border-white/10 px-6 pb-24">
            <button 
              onClick={onSave}
              disabled={saving}
              className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-3 shadow-glow-primary active:scale-[0.98] transition-transform"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={20} />}
              <span className="text-sm font-black uppercase tracking-widest">Registra Combo</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

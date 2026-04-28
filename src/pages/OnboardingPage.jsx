import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CredentialsStep } from '../components/onboarding/CredentialsStep';
import { BladerProfileStep } from '../components/onboarding/BladerProfileStep';
import { supabase } from '../lib/supabaseClient';

const STEPS = ['credentials', 'blader'];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    bladerName: '',
    avatarId: 'avatar-1',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function updateForm(updates) {
    setFormData(prev => ({ ...prev, ...updates }));
    setError(null);
  }

  function nextStep() {
    setStep(s => Math.min(STEPS.length - 1, s + 1));
  }

  async function handleComplete() {
    setLoading(true);
    setError(null);

    try {
      // 1. Registra l'utente su Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Crea/aggiorna il profilo con i dati del blader
      const userId = authData.user?.id;
      if (userId) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: userId,
          username: formData.bladerName.trim(),
          avatar_id: formData.avatarId,
          title: "Blader d'Elite",
          elo: 1000,
          elo_peak: 1000,
          xp: 0,
          onboarding_done: false,  // Welcome tour non ancora visto
        }, { onConflict: 'id' });

        if (profileError) throw profileError;
      }

      // 3. Navigation is handled by auth state change elsewhere, 
      // but we force a welcome redirect for the first time
      navigate('/welcome');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] flex flex-col text-white"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>

      {/* Header con logo + progress */}
      <div className="px-6 pt-10 pb-6">
        <div className="flex items-center justify-between mb-8">
          <img src="/beyx.svg" alt="BeyManager X" className="h-8" />
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">
            Step {step + 1} / {STEPS.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #4361EE, #E94560)' }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.6, ease: 'circOut' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-full animate-shimmer" />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 pb-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full"
          >
            {step === 0 && (
              <CredentialsStep
                formData={formData}
                onChange={updateForm}
                onNext={nextStep}
                error={error}
              />
            )}
            {step === 1 && (
              <BladerProfileStep
                formData={formData}
                onChange={updateForm}
                onComplete={handleComplete}
                onBack={() => setStep(0)}
                loading={loading}
                error={error}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer link to login */}
      <div className="px-6 py-8 text-center bg-gradient-to-t from-[#0A0A1A] to-transparent"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 24px) + 12px)' }}>
        <span className="text-white/30 text-xs font-bold tracking-wider uppercase">Sei già un veterano?</span>
        <button
          onClick={() => navigate('/login')}
          className="text-[#4361EE] text-xs font-black uppercase tracking-[0.15em] ml-2 hover:text-white transition-colors underline-offset-4 underline"
        >
          Accedi qui
        </button>
      </div>
    </div>
  );
}

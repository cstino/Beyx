# BeyManager X — Onboarding: Registrazione Gaming + Welcome Tour

**Briefing for Antigravity — April 2026**

---

Hey Antigravity — trasformiamo la registrazione da "form basico da sito web" a un'esperienza di onboarding stile gioco mobile. Il flow completo è:

1. **Step 1 — Credenziali**: Email + Password + Conferma password (con validazione visiva)
2. **Step 2 — Crea il tuo Blader**: Nome Blader + Avatar picker (con gli avatar già caricati su Supabase)
3. **Step 3 — Welcome Tour**: 4 slide animate che mostrano le feature dell'app
4. → **Redirect alla Home** con splash screen GO SHOOT!

Per chi fa login (utente esistente), salta direttamente all'app — il welcome tour appare solo alla prima registrazione.

---

## 1. Architettura del Flow

### Routing

```jsx
// App.jsx — struttura routing aggiornata

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingPage } from './pages/OnboardingPage';
import { LoginPage } from './pages/LoginPage';
import { WelcomeTourPage } from './pages/WelcomeTourPage';
import { BottomNav } from './components/BottomNav';
import { useAuthStore } from './stores/useAuthStore';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const user = useAuthStore(s => s.user);
  const profile = useAuthStore(s => s.profile);
  const loading = useAuthStore(s => s.loading);

  if (!splashDone) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  if (loading) return null; // O un loading spinner

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes — solo se NON loggato */}
        {!user ? (
          <>
            <Route path="/register" element={<OnboardingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/register" />} />
          </>
        ) : (
          <>
            {/* Welcome tour — solo se profilo appena creato (onboarding_done = false) */}
            {profile && !profile.onboarding_done ? (
              <>
                <Route path="/welcome" element={<WelcomeTourPage />} />
                <Route path="*" element={<Navigate to="/welcome" />} />
              </>
            ) : (
              <>
                {/* App normale — tutte le route esistenti */}
                <Route path="/" element={<HomePage />} />
                {/* ... altre route ... */}
              </>
            )}
          </>
        )}
      </Routes>
      {user && profile?.onboarding_done && <BottomNav />}
    </BrowserRouter>
  );
}
```

### Aggiunta campo al profilo

```sql
-- Flag per tracciare se l'utente ha completato l'onboarding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN NOT NULL DEFAULT false;
```

---

## 2. Pagina di Registrazione: `OnboardingPage.jsx`

Flow a step con progress bar animata, transizioni fluide, e validazione in tempo reale:

```jsx
// pages/OnboardingPage.jsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CredentialsStep } from '../components/onboarding/CredentialsStep';
import { BladerProfileStep } from '../components/onboarding/BladerProfileStep';
import { supabase } from '../lib/supabase';

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

      // 3. Redirect al welcome tour
      navigate('/welcome');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>

      {/* Header con logo + progress */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <img src="/beyx.svg" alt="BeyManager X" className="h-8" />
          <div className="text-[10px] font-bold text-white/40 tracking-[0.15em]">
            STEP {step + 1} / {STEPS.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #4361EE, #E94560)' }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
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
      <div className="px-6 py-6 text-center"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <span className="text-white/40 text-sm">Hai già un account? </span>
        <button
          onClick={() => navigate('/login')}
          className="text-[#4361EE] text-sm font-bold underline underline-offset-4"
        >
          Accedi
        </button>
      </div>
    </div>
  );
}
```

---

## 3. Step 1 — Credenziali

```jsx
// components/onboarding/CredentialsStep.jsx

import { useState, useMemo } from 'react';
import { Mail, Lock, Eye, EyeOff, Check, X, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export function CredentialsStep({ formData, onChange, onNext, error }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({});

  // Validazioni
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const passwordChecks = useMemo(() => ({
    length:    formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number:    /[0-9]/.test(formData.password),
  }), [formData.password]);
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const confirmValid = formData.password === formData.confirmPassword
    && formData.confirmPassword.length > 0;
  const canProceed = emailValid && passwordValid && confirmValid;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          className="text-3xl font-black text-white uppercase tracking-tight leading-tight"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Join the Elite
        </motion.h1>
        <motion.p
          className="text-white/50 text-sm mt-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Crea il tuo account per iniziare la scalata
        </motion.p>
      </div>

      {/* Email field */}
      <div className="mb-5">
        <label className="text-[10px] font-bold text-[#4361EE] tracking-[0.15em] mb-2 block">
          EMAIL
        </label>
        <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors
          bg-[#12122A] ${
            touched.email && !emailValid
              ? 'border-[#E94560]/50'
              : touched.email && emailValid
                ? 'border-[#00D68F]/50'
                : 'border-white/10 focus-within:border-[#4361EE]/50'
          }`}>
          <Mail size={18} className="text-white/30 flex-shrink-0" />
          <input
            type="email"
            placeholder="nome@dominio.com"
            value={formData.email}
            onChange={e => onChange({ email: e.target.value })}
            onBlur={() => setTouched(t => ({ ...t, email: true }))}
            className="flex-1 bg-transparent text-white text-sm font-medium outline-none
              placeholder-white/25"
          />
          {touched.email && emailValid && (
            <Check size={16} className="text-[#00D68F] flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Password field */}
      <div className="mb-3">
        <label className="text-[10px] font-bold text-[#4361EE] tracking-[0.15em] mb-2 block">
          PASSWORD
        </label>
        <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors
          bg-[#12122A] ${
            touched.password && !passwordValid
              ? 'border-[#E94560]/50'
              : touched.password && passwordValid
                ? 'border-[#00D68F]/50'
                : 'border-white/10 focus-within:border-[#4361EE]/50'
          }`}>
          <Lock size={18} className="text-white/30 flex-shrink-0" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimo 8 caratteri"
            value={formData.password}
            onChange={e => onChange({ password: e.target.value })}
            onBlur={() => setTouched(t => ({ ...t, password: true }))}
            className="flex-1 bg-transparent text-white text-sm font-medium outline-none
              placeholder-white/25"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="text-white/30 hover:text-white/60 flex-shrink-0"
            type="button"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Password requirements */}
      {formData.password.length > 0 && (
        <motion.div
          className="mb-5 flex flex-wrap gap-x-4 gap-y-1.5"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <PasswordCheck label="8+ caratteri" valid={passwordChecks.length} />
          <PasswordCheck label="1 maiuscola" valid={passwordChecks.uppercase} />
          <PasswordCheck label="1 numero" valid={passwordChecks.number} />
        </motion.div>
      )}

      {/* Confirm password field */}
      <div className="mb-6">
        <label className="text-[10px] font-bold text-[#4361EE] tracking-[0.15em] mb-2 block">
          CONFERMA PASSWORD
        </label>
        <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors
          bg-[#12122A] ${
            touched.confirm && !confirmValid
              ? 'border-[#E94560]/50'
              : touched.confirm && confirmValid
                ? 'border-[#00D68F]/50'
                : 'border-white/10 focus-within:border-[#4361EE]/50'
          }`}>
          <Shield size={18} className="text-white/30 flex-shrink-0" />
          <input
            type={showConfirm ? 'text' : 'password'}
            placeholder="Ripeti la password"
            value={formData.confirmPassword}
            onChange={e => onChange({ confirmPassword: e.target.value })}
            onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
            className="flex-1 bg-transparent text-white text-sm font-medium outline-none
              placeholder-white/25"
          />
          {touched.confirm && (
            confirmValid
              ? <Check size={16} className="text-[#00D68F] flex-shrink-0" />
              : formData.confirmPassword.length > 0
                ? <X size={16} className="text-[#E94560] flex-shrink-0" />
                : null
          )}
        </div>
        {touched.confirm && !confirmValid && formData.confirmPassword.length > 0 && (
          <div className="text-[#E94560] text-xs mt-1.5 font-medium">
            Le password non coincidono
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <motion.div
          className="mb-4 p-3 rounded-xl bg-[#E94560]/10 border border-[#E94560]/30
            text-[#E94560] text-sm font-medium"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Next button */}
      <motion.button
        onClick={onNext}
        disabled={!canProceed}
        whileTap={canProceed ? { scale: 0.97 } : undefined}
        className="w-full py-4 rounded-xl font-bold tracking-wider text-white
          disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        style={{
          background: canProceed
            ? 'linear-gradient(135deg, #4361EE, #2E45C9)'
            : 'rgba(67,97,238,0.3)',
          boxShadow: canProceed ? '0 4px 20px -4px rgba(67,97,238,0.5)' : 'none',
        }}
      >
        CONTINUA
      </motion.button>
    </div>
  );
}

function PasswordCheck({ label, valid }) {
  return (
    <div className="flex items-center gap-1.5">
      {valid
        ? <Check size={12} className="text-[#00D68F]" />
        : <X size={12} className="text-white/30" />}
      <span className={`text-[11px] font-medium ${
        valid ? 'text-[#00D68F]' : 'text-white/40'
      }`}>
        {label}
      </span>
    </div>
  );
}
```

---

## 4. Step 2 — Crea il tuo Blader

```jsx
// components/onboarding/BladerProfileStep.jsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Sparkles } from 'lucide-react';
import { Avatar, AVATAR_PRESETS } from '../Avatar';

export function BladerProfileStep({ formData, onChange, onComplete, onBack, loading, error }) {
  const nameValid = formData.bladerName.trim().length >= 3
    && formData.bladerName.trim().length <= 16;

  return (
    <div>
      {/* Back button + header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}
          className="p-2 rounded-xl bg-white/5 text-white/50">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} className="text-[#F5A623]" />
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Crea il tuo Blader
          </h1>
        </div>
        <p className="text-white/50 text-sm mb-8">
          Scegli il tuo nome e avatar per l'arena
        </p>
      </motion.div>

      {/* Avatar picker */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Selected avatar preview (grande al centro) */}
        <div className="flex justify-center mb-5">
          <motion.div
            key={formData.avatarId}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative"
          >
            <Avatar avatarId={formData.avatarId} size={100} />
            {/* Glow behind selected avatar */}
            <div
              className="absolute inset-0 rounded-2xl blur-2xl opacity-30 -z-10"
              style={{ background: '#4361EE' }}
            />
          </motion.div>
        </div>

        {/* Avatar grid */}
        <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3">
          SCEGLI IL TUO AVATAR
        </div>
        <div className="grid grid-cols-5 gap-2.5">
          {AVATAR_PRESETS.map((preset, i) => {
            const selected = formData.avatarId === preset.id;
            return (
              <motion.button
                key={preset.id}
                onClick={() => onChange({ avatarId: preset.id })}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.03 }}
                className={`aspect-square rounded-xl flex items-center justify-center
                  transition-all p-1.5
                  ${selected
                    ? 'ring-2 ring-[#4361EE] bg-[#4361EE]/10 scale-110'
                    : 'bg-white/5 opacity-70 hover:opacity-100'}`}
              >
                <Avatar avatarId={preset.id} size={44} />
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Blader name input */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="text-[10px] font-bold text-[#E94560] tracking-[0.15em] mb-2 block">
          NOME BLADER
        </label>
        <div className="flex items-center gap-3 p-3.5 rounded-xl border transition-colors
          bg-[#12122A] border-white/10 focus-within:border-[#E94560]/50">
          <User size={18} className="text-white/30 flex-shrink-0" />
          <input
            type="text"
            placeholder="Scegli un nome unico"
            maxLength={16}
            value={formData.bladerName}
            onChange={e => onChange({ bladerName: e.target.value })}
            className="flex-1 bg-transparent text-white text-sm font-bold outline-none
              placeholder-white/25 uppercase"
          />
          <span className="text-[10px] text-white/30 tabular-nums flex-shrink-0">
            {formData.bladerName.length}/16
          </span>
        </div>
        <div className="text-[10px] text-white/30 mt-1.5">
          3-16 caratteri, sarà visibile nella classifica
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          className="mb-4 p-3 rounded-xl bg-[#E94560]/10 border border-[#E94560]/30
            text-[#E94560] text-sm font-medium"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Create button */}
      <motion.button
        onClick={onComplete}
        disabled={!nameValid || loading}
        whileTap={nameValid && !loading ? { scale: 0.97 } : undefined}
        className="w-full py-4 rounded-xl font-bold tracking-wider text-white
          disabled:opacity-30 disabled:cursor-not-allowed transition-opacity
          flex items-center justify-center gap-2"
        style={{
          background: nameValid && !loading
            ? 'linear-gradient(135deg, #E94560, #C9304A)'
            : 'rgba(233,69,96,0.3)',
          boxShadow: nameValid && !loading
            ? '0 4px 20px -4px rgba(233,69,96,0.5)'
            : 'none',
        }}
      >
        {loading ? (
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <>
            <Sparkles size={16} />
            <span>CREA IL TUO BLADER</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
```

---

## 5. Login Page (aggiornata)

La pagina di login resta separata, semplificata ma con lo stesso stile dell'onboarding:

```jsx
// pages/LoginPage.jsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email, password,
    });

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Email o password non corretti'
          : authError.message
      );
    }

    setLoading(false);
    // Navigation is handled by App.jsx auth state listener
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] flex flex-col justify-center px-6"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>

      {/* Logo + header */}
      <div className="mb-10 text-center">
        <img src="/beyx.svg" alt="BeyManager X" className="h-16 mx-auto mb-6" />
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Bentornato
        </h1>
        <p className="text-white/50 text-sm mt-2">
          Accedi per continuare la tua scalata
        </p>
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="text-[10px] font-bold text-[#4361EE] tracking-[0.15em] mb-2 block">
          EMAIL
        </label>
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#12122A]
          border border-white/10 focus-within:border-[#4361EE]/50">
          <Mail size={18} className="text-white/30" />
          <input
            type="email"
            placeholder="nome@dominio.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm font-medium outline-none
              placeholder-white/25"
          />
        </div>
      </div>

      {/* Password */}
      <div className="mb-6">
        <label className="text-[10px] font-bold text-[#4361EE] tracking-[0.15em] mb-2 block">
          PASSWORD
        </label>
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#12122A]
          border border-white/10 focus-within:border-[#4361EE]/50">
          <Lock size={18} className="text-white/30" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="La tua password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="flex-1 bg-transparent text-white text-sm font-medium outline-none
              placeholder-white/25"
          />
          <button onClick={() => setShowPassword(!showPassword)}
            className="text-white/30 hover:text-white/60" type="button">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          className="mb-4 p-3 rounded-xl bg-[#E94560]/10 border border-[#E94560]/30
            text-[#E94560] text-sm font-medium"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      {/* Login button */}
      <motion.button
        onClick={handleLogin}
        disabled={!email || !password || loading}
        whileTap={{ scale: 0.97 }}
        className="w-full py-4 rounded-xl font-bold tracking-wider text-white
          disabled:opacity-40 flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #4361EE, #2E45C9)',
          boxShadow: '0 4px 20px -4px rgba(67,97,238,0.5)',
        }}
      >
        {loading ? (
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        ) : 'ACCEDI'}
      </motion.button>

      {/* Register link */}
      <div className="mt-6 text-center"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <span className="text-white/40 text-sm">Non hai un account? </span>
        <button
          onClick={() => navigate('/register')}
          className="text-[#E94560] text-sm font-bold underline underline-offset-4"
        >
          Registrati
        </button>
      </div>
    </div>
  );
}
```

---

## 6. Welcome Tour: `WelcomeTourPage.jsx`

4 slide animate con swipe orizzontale e dots indicator. Ogni slide ha un'icona grande, titolo, descrizione e un colore accent tematico.

```jsx
// pages/WelcomeTourPage.jsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, Wrench, Swords, GraduationCap, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';

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
    subtitle: 'Sfida i tuoi amici',
    description: 'Registra le tue battaglie, scala la classifica ELO e sblocca achievement. Formati 1v1, 3v3 e tornei completi.',
    bgGlow: 'rgba(245,166,35,0.15)',
  },
  {
    icon: GraduationCap,
    color: '#00D68F',
    title: 'Impara',
    subtitle: 'Diventa un campione',
    description: 'La X Academy ti guida dalle basi fino alle strategie pro con 24 lezioni, quiz interattivi e certificazioni.',
    bgGlow: 'rgba(0,214,143,0.15)',
  },
];

export function WelcomeTourPage() {
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);
  const [current, setCurrent] = useState(0);

  const isLast = current === SLIDES.length - 1;

  function next() {
    if (isLast) {
      completeOnboarding();
    } else {
      setCurrent(c => c + 1);
    }
  }

  function skip() {
    completeOnboarding();
  }

  async function completeOnboarding() {
    if (userId) {
      await supabase.from('profiles')
        .update({ onboarding_done: true })
        .eq('id', userId);
    }
    // Refresh auth store to pick up the updated profile
    window.location.href = '/';
  }

  // Swipe handling
  const [dragStart, setDragStart] = useState(0);
  function handleDragEnd(_, info) {
    if (info.offset.x < -50 && current < SLIDES.length - 1) {
      setCurrent(c => c + 1);
    } else if (info.offset.x > 50 && current > 0) {
      setCurrent(c => c - 1);
    }
  }

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-[#0A0A1A] flex flex-col"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      }}>

      {/* Skip button */}
      <div className="px-6 flex justify-end">
        {!isLast && (
          <button
            onClick={skip}
            className="text-white/30 text-xs font-bold tracking-[0.15em]
              hover:text-white/60 transition-colors py-2"
          >
            SALTA
          </button>
        )}
      </div>

      {/* Main content — swipeable */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-8"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.35 }}
          >
            {/* Icon with glow */}
            <div className="relative mb-8">
              <div
                className="absolute inset-0 rounded-3xl blur-[60px]"
                style={{ background: slide.bgGlow }}
              />
              <motion.div
                className="relative w-28 h-28 rounded-3xl flex items-center justify-center border"
                style={{
                  background: `${slide.color}10`,
                  borderColor: `${slide.color}30`,
                }}
                initial={{ scale: 0.7, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, delay: 0.1 }}
              >
                <Icon size={48} style={{ color: slide.color }} strokeWidth={1.8} />
              </motion.div>
            </div>

            {/* Title */}
            <motion.h2
              className="text-4xl font-black text-white uppercase tracking-tight mb-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {slide.title}
            </motion.h2>

            {/* Subtitle */}
            <motion.div
              className="text-sm font-bold tracking-[0.1em] uppercase mb-4"
              style={{ color: slide.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {slide.subtitle}
            </motion.div>

            {/* Description */}
            <motion.p
              className="text-white/60 text-base leading-relaxed max-w-xs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Bottom section: dots + button */}
      <div className="px-6 pb-4">
        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === current ? 24 : 8,
                height: 8,
                background: i === current ? SLIDES[current].color : 'rgba(255,255,255,0.15)',
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Next / Start button */}
        <motion.button
          onClick={next}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-xl font-bold tracking-wider text-white
            flex items-center justify-center gap-2"
          style={{
            background: isLast
              ? 'linear-gradient(135deg, #E94560, #C9304A)'
              : `linear-gradient(135deg, ${slide.color}, ${slide.color}CC)`,
            boxShadow: `0 4px 20px -4px ${slide.color}80`,
          }}
        >
          {isLast ? (
            <>
              <Swords size={18} />
              <span>INIZIA L'AVVENTURA</span>
            </>
          ) : (
            <>
              <span>CONTINUA</span>
              <ChevronRight size={18} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
```

---

## 7. Le 4 Slide del Welcome Tour

| # | Icona | Colore | Titolo | Sottotitolo | Descrizione |
|---|---|---|---|---|---|
| 1 | `Package` | `#4361EE` blu | **COLLEZIONA** | Tieni traccia delle tue parti | Aggiungi alla collezione tutti i tuoi Blade, Ratchet e Bit. Vedi le statistiche, il peso reale e il tier di ogni parte. |
| 2 | `Wrench` | `#E94560` rosso | **COSTRUISCI** | Crea combo vincenti | Combina le tue parti per trovare la combo perfetta. Il Builder calcola automaticamente score, matchup e peso totale. |
| 3 | `Swords` | `#F5A623` oro | **COMBATTI** | Sfida i tuoi amici | Registra le tue battaglie, scala la classifica ELO e sblocca achievement. Formati 1v1, 3v3 e tornei completi. |
| 4 | `GraduationCap` | `#00D68F` verde | **IMPARA** | Diventa un campione | La X Academy ti guida dalle basi fino alle strategie pro con 24 lezioni, quiz interattivi e certificazioni. |

Ogni slide ha:
- Icona grande (48px) con glow sfumato dietro + bordo + background tematico
- Titolo bold 4xl uppercase
- Sottotitolo nel colore accent
- Descrizione in bianco/60 con max-width contenuto
- Transizione slide-left/right con AnimatePresence
- Swipe support (drag orizzontale con Framer Motion)
- Dots indicator con dot attivo allungato e colorato

L'ultima slide cambia il bottone da "CONTINUA →" a "INIZIA L'AVVENTURA" con icona spade e colore rosso.

---

## 8. File Structure

```
pages/
├── OnboardingPage.jsx        ← nuovo (flow registrazione)
├── LoginPage.jsx             ← aggiornato (stesso stile)
└── WelcomeTourPage.jsx       ← nuovo (4 slide tutorial)

components/
└── onboarding/
    ├── CredentialsStep.jsx   ← nuovo (email + password)
    └── BladerProfileStep.jsx ← nuovo (nome + avatar)
```

---

## 9. Checklist Implementazione

1. ✅ **Aggiungi campo `onboarding_done`** alla tabella profiles (`ALTER TABLE`)
2. ✅ **Crea `components/onboarding/CredentialsStep.jsx`** — validazione live
3. ✅ **Crea `components/onboarding/BladerProfileStep.jsx`** — avatar + nome
4. ✅ **Crea `pages/OnboardingPage.jsx`** — flow a step con progress bar
5. ✅ **Aggiorna `pages/LoginPage.jsx`** — stesso stile visivo
6. ✅ **Crea `pages/WelcomeTourPage.jsx`** — 4 slide con swipe
7. ✅ **Aggiorna `App.jsx`** — routing condizionale (unauth → onboarding, auth+!onboarding → welcome, auth+onboarding → app)
8. ✅ **Test completo del flow**: Registrazione → Credenziali → Blader → Welcome Tour → Home
9. ✅ **Test login esistente**: Login → Home (skip welcome se già completato)
10. ✅ **Test su mobile**: swipe tra le slide, safe-area, keyboard behavior sugli input

---

*End of Briefing — BeyManager X Onboarding — April 2026*

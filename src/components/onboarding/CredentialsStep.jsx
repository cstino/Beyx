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
    <div className="flex flex-col h-full">
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

      <div className="flex-1 space-y-6">
        {/* Email field */}
        <div>
          <label className="text-[10px] font-bold text-[#4361EE] tracking-[0.15em] mb-2 block">
            EMAIL
          </label>
          <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors
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
        <div>
          <label className="text-[10px] font-bold text-[#4361EE] tracking-[0.15em] mb-2 block">
            PASSWORD
          </label>
          <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors
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

          {/* Password requirements */}
          {formData.password.length > 0 && (
            <motion.div
              className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <PasswordCheck label="8+ caratteri" valid={passwordChecks.length} />
              <PasswordCheck label="1 maiuscola" valid={passwordChecks.uppercase} />
              <PasswordCheck label="1 numero" valid={passwordChecks.number} />
            </motion.div>
          )}
        </div>

        {/* Confirm password field */}
        <div>
          <label className="text-[10px] font-bold text-[#4361EE] tracking-[0.15em] mb-2 block">
            CONFERMA PASSWORD
          </label>
          <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors
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
      </div>

      {/* Error */}
      {error && (
        <motion.div
          className="my-6 p-4 rounded-2xl bg-[#E94560]/10 border border-[#E94560]/30
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
        className="w-full py-5 rounded-2xl font-black tracking-widest text-[#0A0A1A] mt-6
          disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase text-xs"
        style={{
          background: canProceed
            ? 'linear-gradient(135deg, #4361EE, #5071FF)'
            : 'rgba(67,97,238,0.3)',
          boxShadow: canProceed ? '0 8px 30px -10px rgba(67,97,238,0.5)' : 'none',
          color: canProceed ? '#FFFFFF' : 'rgba(255,255,255,0.3)'
        }}
      >
        Continua
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
      <span className={`text-[11px] font-bold ${
        valid ? 'text-[#00D68F]' : 'text-white/40'
      }`}>
        {label}
      </span>
    </div>
  );
}

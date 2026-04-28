import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    if (e) e.preventDefault();
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
      setLoading(false);
    }
    // Navigation is handled by App.jsx auth state listener
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] flex flex-col justify-center px-6 relative overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#4361EE] opacity-10 blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E94560] opacity-10 blur-[120px]" />

      {/* Logo + header */}
      <div className="mb-12 text-center relative z-10">
        <img src="/beyx.svg" alt="BeyManager X" className="h-24 mx-auto mb-8 drop-shadow-[0_0_20px_rgba(67,97,238,0.3)]" />
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">
          Bentornato
        </h1>
        <p className="text-white/40 text-xs mt-3 font-bold uppercase tracking-[0.2em] opacity-60">
          Accedi per continuare la tua scalata
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6 relative z-10">
        {/* Email */}
        <div>
          <label className="text-[10px] font-black text-[#4361EE] tracking-[0.2em] mb-3 block uppercase">
            Email
          </label>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#12122A]
            border border-white/5 focus-within:border-[#4361EE]/40 transition-all shadow-inner">
            <Mail size={18} className="text-white/20" />
            <input
              type="email"
              placeholder="NOME@DOMINIO.COM"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm font-bold outline-none
                placeholder-white/10 uppercase tracking-widest"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-[10px] font-black text-[#4361EE] tracking-[0.2em] mb-3 block uppercase">
            Password
          </label>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#12122A]
            border border-white/5 focus-within:border-[#4361EE]/40 transition-all shadow-inner">
            <Lock size={18} className="text-white/20" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm font-bold outline-none
                placeholder-white/10 tracking-widest"
              required
            />
            <button onClick={() => setShowPassword(!showPassword)}
              className="text-white/20 hover:text-white/50 transition-colors" type="button">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="p-4 rounded-2xl bg-[#E94560]/10 border border-[#E94560]/20
                text-[#E94560] text-xs font-bold uppercase tracking-wider text-center"
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login button */}
        <motion.button
          type="submit"
          disabled={!email || !password || loading}
          whileTap={{ scale: 0.97 }}
          className="w-full py-5 rounded-2xl font-black tracking-[0.2em] text-white
            disabled:opacity-20 flex items-center justify-center gap-3 transition-all uppercase text-xs"
          style={{
            background: 'linear-gradient(135deg, #4361EE, #2E45C9)',
            boxShadow: '0 8px 30px -10px rgba(67,97,238,0.5)',
          }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Accedi all'Arena</span>
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </form>

      {/* Register link */}
      <div className="mt-12 text-center relative z-10"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <p className="text-white/20 text-xs font-bold uppercase tracking-widest">
          Non hai ancora un account?
        </p>
        <button
          onClick={() => navigate('/register')}
          className="mt-3 text-[#E94560] text-xs font-black uppercase tracking-[0.2em] hover:text-white transition-colors underline underline-offset-8"
        >
          Registrati Ora
        </button>
      </div>
    </div>
  );
}

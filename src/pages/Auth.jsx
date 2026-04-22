import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Github } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Logo from '../components/Logo';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: '', // In seguito aggiungiamo input nome
            }
          }
        });
        if (error) throw error;
        alert('Controlla la tua email per confermare la registrazione!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-accent/20 blur-3xl rounded-full" />

        <div className="text-center mb-8 relative z-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex justify-center mb-4"
          >
            <div className="w-32 h-32 relative">
              <Logo className="w-full h-full relative z-10" />
            </div>
          </motion.div>

          <h2 className="text-3xl font-display font-extrabold italic tracking-tighter leading-none">
            {isLogin ? 'WELCOME BACK' : 'JOIN THE ELITE'}
          </h2>
          <p className="text-slate-400 text-xs mt-3 uppercase tracking-widest font-bold opacity-60">
            {isLogin ? 'Accedi al tuo archivio Blader' : 'Inizia la tua scalata alla cima'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4 relative z-10">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1 mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10" 
                placeholder="nome@dominio.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1 mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10" 
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 group"
          >
            {loading ? 'Caricamento...' : (isLogin ? 'Accedi' : 'Registrati')}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface px-2 text-slate-500">Oppure continua con</span></div>
          </div>

          <button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl py-3 flex items-center justify-center gap-2 transition-all">
            <Github size={20} />
            GitHub
          </button>

          <p className="text-xs text-slate-500">
            {isLogin ? "Non hai un account?" : "Hai già un account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold ml-1 hover:underline underline-offset-2"
            >
              {isLogin ? 'Registrati' : 'Accedi'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

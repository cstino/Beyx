import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Package, Hammer, Award, ChevronRight, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ parts: 0, combos: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      const [prof, partsCount, combosCount, topBladers] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_collections').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('combos').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('leaderboard').select('*').limit(3)
      ]);

      setProfile(prof.data);
      setStats({ 
        parts: partsCount.count || 0, 
        combos: combosCount.count || 0 
      });
      setLeaderboard(topBladers.data || []);
      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const nextLevelXp = (Math.pow(profile?.level || 1, 2) * 50);
  const currentLevelBaseXp = (Math.pow((profile?.level || 1) - 1, 2) * 50);
  const progress = ((profile?.xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 px-4">
      {/* Profile & XP Hero */}
      <section className="relative pt-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-2xl border-2 border-primary/30 p-1 bg-surface relative">
            <img 
              src={profile?.avatar_url} 
              alt="Avatar" 
              className="w-full h-full rounded-xl object-cover"
            />
            <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-md shadow-glow-primary">
              LVL {profile?.level}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Bentornato, {profile?.username}</h1>
            <p className="text-slate-400 text-sm italic">Status: Blader d'Elite</p>
          </div>
        </div>

        {/* XP Progress */}
        <div className="glass-card p-6 border-primary/20">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Esperienza Blader</p>
              <h3 className="text-xl font-black">{profile?.xp} XP</h3>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase">Prossimo: {nextLevelXp} XP</p>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full shadow-glow-primary"
            />
          </div>
        </div>
      </section>

      {/* Quick Actions / Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <Link to="/collection" className="glass-card p-4 flex items-center gap-3 hover:border-primary/40 transition-all">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Package size={20} />
          </div>
          <div>
            <p className="text-lg font-black">{stats.parts}</p>
            <p className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">Parti</p>
          </div>
        </Link>
        <Link to="/builder" className="glass-card p-4 flex items-center gap-3 hover:border-accent/40 transition-all">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <Hammer size={20} />
          </div>
          <div>
            <p className="text-lg font-black">{stats.combos}</p>
            <p className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">Combo</p>
          </div>
        </Link>
      </section>

      {/* Leaderboard Snippet */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" /> TOP BLADERS
          </h2>
          <ChevronRight size={16} className="text-slate-600" />
        </div>
        <div className="space-y-3">
          {leaderboard.map((blader, idx) => (
            <div key={blader.id} className="glass-card p-3 flex items-center justify-between group hover:bg-white/5 transition-all">
              <div className="flex items-center gap-3">
                <div className="text-xs font-black w-4 text-slate-500">#{idx + 1}</div>
                <div className="w-10 h-10 rounded-full border border-white/10 bg-surface">
                  <img src={blader.avatar_url} alt="" className="w-full h-full rounded-full" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase">{blader.username}</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-tighter">Livello {blader.level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-primary">{blader.xp} XP</p>
                <p className="text-[8px] text-slate-600 uppercase italic">{blader.wins} Wins</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Launch Button */}
      <Link to="/builder" className="btn-accent w-full py-4 flex items-center justify-center gap-3">
        <TrendingUp size={20} />
        <span className="font-black uppercase tracking-widest">Analizza Meta & Combo</span>
      </Link>
    </div>
  );
}

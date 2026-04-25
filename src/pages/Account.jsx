import React, { useState, useEffect } from 'react';
import { Edit3, Trophy, LogOut, Settings, Award, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from '../components/Avatar';
import { StatGrid } from '../components/account/StatGrid';
import { AchievementsGrid } from '../components/account/AchievementsGrid';
import { EditProfileModal } from '../components/account/EditProfileModal';
import { PageContainer } from '../components/PageContainer';

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, profile, signOut, fetchProfile } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
      loadAccountData();
    }
  }, [user, fetchProfile]);

  async function loadAccountData() {
    setLoading(true);
    const [s, a] = await Promise.all([
      fetchStats(user.id),
      fetchAchievements(user.id),
    ]);
    setStats(s);
    setAchievements(a);
    setLoading(false);
  }

  async function fetchStats(userId) {
    const [battleStats, ownedParts, combos] = await Promise.all([
      supabase.rpc('get_user_battle_stats', { user_id: userId }),
      supabase.from('user_collections').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('combos').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    return {
      wins:         battleStats.data?.wins ?? 0,
      losses:       battleStats.data?.losses ?? 0,
      winRate:      battleStats.data?.win_rate ?? 0,
      totalBattles: battleStats.data?.total ?? 0,
      partsOwned:   ownedParts.count ?? 0,
      combosCount:  combos.count ?? 0,
    };
  }

  async function fetchAchievements(userId) {
    const { data: all } = await supabase.from('achievements').select('*').order('sort_order');
    const { data: unlocked } = await supabase.from('user_achievements')
      .select('achievement_id').eq('user_id', userId);
    
    const unlockedIds = new Set((unlocked ?? []).map(u => u.achievement_id));
    return (all ?? []).map(a => ({ ...a, unlocked: unlockedIds.has(a.id) }));
  }

  // XP level helpers
  const getLevel = (xp) => Math.max(1, Math.floor(Math.sqrt((xp || 0) / 50)) + 1);
  const getXpForNextLevel = (xp) => getLevel(xp) * getLevel(xp) * 50;
  const getProgress = (xp) => {
    const lvl = getLevel(xp);
    const currentLevelStart = (lvl - 1) * (lvl - 1) * 50;
    const nextLevelStart = lvl * lvl * 50;
    const progress = ((xp - currentLevelStart) / (nextLevelStart - currentLevelStart)) * 100;
    return Math.min(100, Math.max(5, progress));
  };

  if (!profile && loading) return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <PageContainer className="pt-6">
      {/* Hero Header */}
      <div className="relative px-6 pb-12 overflow-hidden">
        {/* Abstract background glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-[#4361EE]/10 rounded-full blur-[100px] -ml-32" />

        <div className="relative flex flex-col items-center">
          <div className="relative">
            <Avatar
              avatarId={profile?.avatar_id}
              size={110}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setEditing(true)}
              className="absolute bottom-1 right-1 w-9 h-9 rounded-xl bg-white text-[#0A0A1A] flex items-center justify-center border-4 border-[#0A0A1A] shadow-lg"
            >
              <Edit3 size={16} />
            </motion.button>
          </div>

          <div className="mt-6 text-center">
            <div className="text-primary font-black text-[10px] tracking-[0.3em] uppercase mb-1 drop-shadow-glow">
              Blader Lv.{getLevel(profile?.xp)}
            </div>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
              {profile?.username || 'Guerriero'}
            </h1>
            <p className="text-white/40 text-[10px] font-black tracking-[0.2em] uppercase mt-2">
              {profile?.title || "Blader d'Elite"}
            </p>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-10 px-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">XP Progress</span>
            <span className="text-[9px] font-black text-white uppercase tracking-widest">
              {profile?.xp || 0} <span className="text-white/20">/</span> {getXpForNextLevel(profile?.xp)} CP
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getProgress(profile?.xp)}%` }}
              style={{ background: 'linear-gradient(90deg, #4361EE, #E94560)' }}
              transition={{ duration: 1, ease: "circOut" }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 space-y-10">
        {/* Stats Grid */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-[3px] h-4 bg-primary" />
            <h2 className="text-[11px] font-black text-white tracking-[0.2em] uppercase">Rendimento</h2>
          </div>
          <StatGrid stats={stats} />
        </section>

        {/* Achievements */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-4 bg-[#F5A623]" />
              <h2 className="text-[11px] font-black text-white tracking-[0.2em] uppercase">Bacheca Medaglie</h2>
            </div>
            <div className="text-[10px] font-black text-white/20 flex items-center gap-1">
              <Award size={12} /> {achievements.filter(a => a.unlocked).length}/{achievements.length}
            </div>
          </div>
          <AchievementsGrid achievements={achievements} />
        </section>

        {/* Actions */}
        <div className="pt-8 space-y-3 pb-12">
          {profile?.is_admin && (
            <button 
              onClick={() => navigate('/admin')}
              className="w-full py-5 rounded-2xl bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center gap-3 text-[#F5A623] text-[10px] font-black tracking-[0.2em] uppercase hover:bg-[#F5A623]/20 transition-all shadow-lg shadow-[#F5A623]/5"
            >
              <Shield size={16} /> Bey Control Center
            </button>
          )}

          <button 
            onClick={signOut}
            className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center gap-3 text-white/40 text-[10px] font-black tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} /> Disconnetti Account
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            loadAccountData();
          }}
        />
      )}
    </PageContainer>
  );
}

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useUIStore } from '../store/useUIStore';
import { Avatar } from '../components/Avatar';
import { StatGrid } from '../components/account/StatGrid';
import { EloSection } from '../components/account/EloSection';
import { RankBadge, getRankFromElo } from '../components/RankBadge';
import { AchievementsGrid } from '../components/account/AchievementsGrid';
import { PageContainer } from '../components/PageContainer';

export default function PlayerProfilePage() {
  const { userId } = useParams();
  const { setHeader, clearHeader } = useUIStore();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) loadPlayer();
  }, [userId]);

  useEffect(() => {
    setHeader('PROFILO', '/leaderboard');
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  async function loadPlayer() {
    setLoading(true);
    const [{ data: p }, s, a] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      fetchStats(userId),
      fetchAchievements(userId),
    ]);
    setProfile(p);
    setStats(s);
    setAchievements(a);
    setLoading(false);
  }

  async function fetchStats(targetId) {
    const [battleStats, ownedParts, combos] = await Promise.all([
      supabase.rpc('get_user_battle_stats', { user_id: targetId }),
      supabase.from('user_collections').select('id', { count: 'exact', head: true }).eq('user_id', targetId),
      supabase.from('combos').select('id', { count: 'exact', head: true }).eq('user_id', targetId),
    ]);
    return {
      wins: battleStats.data?.wins ?? 0,
      losses: battleStats.data?.losses ?? 0,
      winRate: battleStats.data?.win_rate ?? 0,
      totalBattles: battleStats.data?.total ?? 0,
      partsOwned: ownedParts.count ?? 0,
      combosCount: combos.count ?? 0,
    };
  }

  async function fetchAchievements(targetId) {
    const { data: all } = await supabase.from('achievements').select('*').order('sort_order');
    const { data: unlocked } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', targetId);
    const unlockedIds = new Set((unlocked ?? []).map(u => u.achievement_id));
    return (all ?? []).map(a => ({ ...a, unlocked: unlockedIds.has(a.id) }));
  }

  const getLevel = (xp) => Math.max(1, Math.floor(Math.sqrt((xp || 0) / 50)) + 1);
  const getXpForNextLevel = (xp) => getLevel(xp) * getLevel(xp) * 50;
  const getProgress = (xp) => {
    const lvl = getLevel(xp);
    const currentLevelStart = (lvl - 1) * (lvl - 1) * 50;
    const nextLevelStart = lvl * lvl * 50;
    const progress = ((xp - currentLevelStart) / (nextLevelStart - currentLevelStart)) * 100;
    return Math.min(100, Math.max(5, progress));
  };

  if (loading) return (
    <PageContainer>
      <div className="flex justify-center p-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </PageContainer>
  );

  if (!profile) return (
    <PageContainer>
      <div className="text-center py-20 text-white/30 text-sm font-black uppercase">
        Giocatore non trovato
      </div>
    </PageContainer>
  );

  const { display, tier } = getRankFromElo(profile?.elo || 1000, profile?.placement_done);
  const RankIcon = tier?.icon;

  return (
    <PageContainer className="pt-6">
      <div className="relative px-6 pb-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-[#4361EE]/10 rounded-full blur-[100px] -ml-32" />

        <div className="relative flex flex-col items-center">
          <Avatar avatarId={profile?.avatar_id} size={110} />

          <div className="mt-5 text-center flex flex-col items-center">
            <h1 className="text-3xl font-black text-white italic leading-none font-createfuture tracking-[0.05em]">
              {profile?.username || 'Guerriero'}
            </h1>

            <div className="flex items-center justify-center gap-2.5 mt-3">
              <div className="text-primary font-black text-[11px] tracking-[0.2em] uppercase bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
                Lv.{getLevel(profile?.xp)}
              </div>

              <div
                className="flex items-center gap-2 py-1 px-3 rounded-xl border shadow-md transition-all"
                style={{
                  background: `${tier?.color || '#FFFFFF'}15`,
                  borderColor: `${tier?.color || '#FFFFFF'}40`,
                  boxShadow: `0 0 12px -2px ${tier?.color || '#FFFFFF'}30`
                }}
              >
                {RankIcon && <RankIcon size={13} style={{ color: tier?.color || '#FFFFFF' }} strokeWidth={2.5} />}
                <span
                  className="text-[10px] font-black uppercase tracking-[0.15em] italic font-createfuture leading-none pt-0.5"
                  style={{ color: tier?.color || '#FFFFFF' }}
                >
                  {display}
                </span>
              </div>
            </div>
          </div>
        </div>

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
              transition={{ duration: 1, ease: 'circOut' }}
            />
          </div>
        </div>
      </div>

      <div className="px-6 space-y-10">
        {profile && <EloSection profile={profile} />}

        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-[3px] h-4 bg-primary" />
            <h2 className="text-[11px] font-black text-white tracking-[0.2em] uppercase">Rendimento</h2>
          </div>
          <StatGrid stats={stats} userId={userId} />
        </section>

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

        <div className="pb-12" />
      </div>
    </PageContainer>
  );
}

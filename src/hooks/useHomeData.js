import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useHomeData(userId) {
  const [data, setData] = useState({
    blader: null,
    parts: { owned: 0, total: 0 },
    combos: { count: 0 },
    topBladers: [],
    loading: true,
  });

  useEffect(() => {
    if (!userId) return;
    
    async function load() {
      try {
        const [profile, ownedParts, totalBlades, totalRatchets, totalBits, userCombos, leaderboard] =
          await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).single(),
            supabase.from('user_collections').select('id', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('blades').select('id', { count: 'exact', head: true }),
            supabase.from('ratchets').select('id', { count: 'exact', head: true }),
            supabase.from('bits').select('id', { count: 'exact', head: true }),
            supabase.from('combos').select('id', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('leaderboard').select('*').limit(3),
          ]);

        const totalParts = (totalBlades.count ?? 0) + (totalRatchets.count ?? 0) + (totalBits.count ?? 0);
        const xp = profile.data?.xp ?? 0;
        const currentLevel = Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1);
        const xpNext = currentLevel * currentLevel * 50;

        setData({
          blader: {
            username: profile.data?.username,
            avatar_url: profile.data?.avatar_url,
            level: currentLevel,
            xp: xp,
            xpNext: xpNext,
            status: "Blader d'Elite",
          },
          parts: { owned: ownedParts.count ?? 0, total: totalParts },
          combos: { count: userCombos.count ?? 0 },
          topBladers: leaderboard.data ?? [],
          loading: false,
        });
      } catch (error) {
        console.error("Error loading home data:", error);
        setData(prev => ({ ...prev, loading: false }));
      }
    }
    
    load();
  }, [userId]);

  return data;
}

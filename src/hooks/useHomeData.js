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
        // 1. Prima prendiamo il profilo per avere l'ELO base
        const { data: profileData, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (pError) throw pError;

        // 2. Poi prendiamo tutto il resto in parallelo, incluso il rank basato sull'ELO appena ottenuto
        const [ownedParts, totalBlades, totalRatchets, totalBits, userCombos, leaderboard, rankQuery] =
          await Promise.all([
            supabase.from('user_collections').select('id', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('blades').select('id', { count: 'exact', head: true }),
            supabase.from('ratchets').select('id', { count: 'exact', head: true }),
            supabase.from('bits').select('id', { count: 'exact', head: true }),
            supabase.from('combos').select('id', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('profiles')
              .select('id, username, avatar_id, title, elo, elo_peak, elo_matches')
              .order('elo', { ascending: false })
              .limit(3),
            supabase.from('profiles')
              .select('id', { count: 'exact', head: true })
              .gt('elo', profileData?.elo ?? 1000),
          ]);

        const totalParts = (totalBlades.count ?? 0) + (totalRatchets.count ?? 0) + (totalBits.count ?? 0);
        const xp = profileData?.xp ?? 0;
        const currentLevel = Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1);
        const xpNext = currentLevel * currentLevel * 50;
        const globalRank = (rankQuery.count ?? 0) + 1;

        setData({
          blader: {
            username: profileData?.username,
            avatar_url: profileData?.avatar_url,
            avatar_id: profileData?.avatar_id, 
            title: profileData?.title,         
            level: currentLevel,
            xp: xp,
            xpNext: xpNext,
            status: profileData?.title || "Blader d'Elite",
            elo: profileData?.elo ?? 1000,
            elo_peak: profileData?.elo_peak ?? 1000,
            elo_matches: profileData?.elo_matches ?? 0,
            placement_done: profileData?.placement_done ?? false,
            rank: globalRank,
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
    
    // Listen for profile changes to keep Dashboard in sync!
    const channel = supabase
      .channel('profile-sync')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${userId}` 
      }, () => {
        load(); // Reload data on any profile update
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return data;
}

import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

let profileSubscription = null;

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  
  fetchProfile: async (userOrId) => {
    const userId = typeof userOrId === 'string' ? userOrId : userOrId?.id;
    const userObj = typeof userOrId === 'object' ? userOrId : null;
    if (!userId) return;
    
    // Gestione speciale per account Arbitro iPad (nessun record nel DB per non renderlo un giocatore giocabile)
    if (userObj?.email === 'hcskso96@gmail.com') {
      set({
        profile: {
          id: userId,
          username: 'Arbitro iPad',
          avatar_id: 'avatar-1',
          xp: 0,
          level: 99,
          title: 'Arbitro Ufficiale',
          onboarding_done: true,
          is_admin: true,
          elo: 1000,
          elo_peak: 1000
        }
      });
      return;
    }

    // Setup real-time listener for the user's profile updates globally
    if (!profileSubscription) {
      profileSubscription = supabase
        .channel('global-profile-sync')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        }, (payload) => {
          set({ profile: payload.new });
        })
        .subscribe();
    }

    // 1. Tenta di recuperare il profilo esistente
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (data) {
      set({ profile: data });
      return;
    }

    // 2. Se il profilo manca, tentiamo di crearlo (Auto-Repair)
    // Questo succede se il trigger DB fallisce o se l'utente è "vecchio"
    console.log("Profile missing for user, attempting auto-repair...");
    
    const newProfile = {
      id: userId,
      username: userObj?.user_metadata?.username || userObj?.email?.split('@')[0] || 'Blader_' + userId.slice(0, 5),
      avatar_id: userObj?.user_metadata?.avatar_id || 'avatar-1',
      xp: 0,
      level: 1,
      title: 'Blader Novizio',
      onboarding_done: false,
      elo: 1000,
      elo_peak: 1000
    };

    const { data: repaired, error: repairError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (!repairError && repaired) {
      set({ profile: repaired });
    } else {
      console.error("Auto-repair failed:", repairError);
    }
  },

  setLoading: (loading) => set({ loading }),
  
  signOut: async () => {
    if (profileSubscription) {
      supabase.removeChannel(profileSubscription);
      profileSubscription = null;
    }
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  }
}));

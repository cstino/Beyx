import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  
  fetchProfile: async (user) => {
    if (!user?.id) return;
    
    // 1. Tenta di recuperare il profilo esistente
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    if (data) {
      set({ profile: data });
      return;
    }

    // 2. Se il profilo manca, tentiamo di crearlo (Auto-Repair)
    // Questo succede se il trigger DB fallisce o se l'utente è "vecchio"
    console.log("Profile missing for user, attempting auto-repair...");
    
    const newProfile = {
      id: user.id,
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'Blader_' + user.id.slice(0, 5),
      avatar_id: user.user_metadata?.avatar_id || 'avatar-1',
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
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  }
}));

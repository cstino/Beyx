import React, { useState, useEffect } from 'react';
import { ChevronLeft, Swords, Trophy, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { motion } from 'framer-motion';
import { Avatar } from '../../components/Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

export default function BattleHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const setHeader = useUIStore(s => s.setHeader);
  const clearHeader = useUIStore(s => s.clearHeader);
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHeader('STORICO ARENE', '/battle');
    return () => clearHeader();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    const { data } = await supabase
      .from('battles')
      .select(`
        *,
        p1:player1_user_id(username, avatar_id, avatar_color),
        p2:player2_user_id(username, avatar_id, avatar_color)
      `)
      .order('played_at', { ascending: false });
    
    setBattles(data || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-32 pt-4">
      {/* Header Info */}
      <div className="px-6 mb-6">
          <div className="text-[10px] font-black text-primary tracking-[0.2em] uppercase mb-1">Archive</div>
          <h1 className="text-white font-black text-lg uppercase italic">Cronologia Battaglie</h1>
      </div>

      <div className="px-6 space-y-4">
        {loading ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-28 bg-white/5 rounded-3xl border border-white/5 animate-pulse" />
          ))
        ) : battles.length === 0 ? (
          <div className="py-20 text-center opacity-20">
            <Swords size={48} className="mx-auto mb-4" />
            <div className="text-sm font-black uppercase tracking-widest">Nessun dato registrato</div>
          </div>
        ) : (
          battles.map((battle, i) => (
            <motion.div
              key={battle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative p-5 rounded-3xl bg-[#12122A] border border-white/5 overflow-hidden group"
            >
              {/* Barra laterale: Blu se coinvolge l'utente, Rosso se no */}
              <div className={`absolute top-0 bottom-0 left-0 w-[4px]
                ${(user && (battle.player1_user_id === user.id || battle.player2_user_id === user.id)) 
                  ? 'bg-[#4361EE]' 
                  : 'bg-[#E94560]'}`} 
              />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={10} className="text-white/20" />
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                      {new Date(battle.played_at).toLocaleDateString()} · {battle.format}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    {/* Player 1 */}
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar avatarId={battle.p1?.avatar_id} size={28} showFallback={!battle.p1} username={battle.player1_guest_name} />
                      <div className={`text-xs font-black uppercase tracking-tight truncate ${battle.winner_side === 'p1' ? 'text-white' : 'text-white/30'}`}>
                        {battle.p1?.username || battle.player1_guest_name}
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 min-w-[80px] justify-center">
                      <span className={`text-lg font-black italic ${battle.winner_side === 'p1' ? 'text-[#E94560]' : 'text-white/40'}`}>
                        {battle.points_p1}
                      </span>
                      <span className="text-[10px] font-black text-white/10">-</span>
                      <span className={`text-lg font-black italic ${battle.winner_side === 'p2' ? 'text-[#E94560]' : 'text-white/40'}`}>
                        {battle.points_p2}
                      </span>
                    </div>

                    {/* Player 2 */}
                    <div className="flex items-center gap-3 flex-1 flex-row-reverse text-right">
                      <Avatar avatarId={battle.p2?.avatar_id} size={28} showFallback={!battle.p2} username={battle.player2_guest_name} />
                      <div className={`text-xs font-black uppercase tracking-tight truncate ${battle.winner_side === 'p2' ? 'text-white' : 'text-white/30'}`}>
                        {battle.p2?.username || battle.player2_guest_name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {battle.notes && (
                <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-white/20 font-medium italic">
                  "{battle.notes}"
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

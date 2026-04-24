import React, { useState, useEffect } from 'react';
import { ChevronLeft, Swords, Trophy, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { motion } from 'framer-motion';
import { Avatar } from '../../components/Avatar';

export default function BattleHistoryPage() {
  const navigate = useNavigate();
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-[#0A0A1A] pb-32">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 flex items-center gap-4 sticky top-0 bg-[#0A0A1A]/80 backdrop-blur-xl z-30">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5 active:scale-90 transition-all">
          <ChevronLeft size={22} />
        </button>
        <div>
          <div className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Archive</div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Storico Arene</h1>
        </div>
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
              <div className={`absolute top-0 bottom-0 left-0 w-[4px]
                ${battle.winner_side === 'p1' ? 'bg-[#E94560]' : 
                  battle.winner_side === 'p2' ? 'bg-[#4361EE]' : 'bg-white/20'}`} 
              />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={10} className="text-white/20" />
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                      {new Date(battle.played_at).toLocaleDateString()} · {battle.format}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                       <Avatar avatarId={battle.p1?.avatar_id} size={24} showFallback={!battle.p1} username={battle.player1_guest_name} />
                       <span className={`text-xs font-black uppercase tracking-tight ${battle.winner_side === 'p1' ? 'text-white' : 'text-white/30'}`}>
                         {battle.p1?.username || battle.player1_guest_name}
                       </span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Avatar avatarId={battle.p2?.avatar_id} size={24} showFallback={!battle.p2} username={battle.player2_guest_name} />
                       <span className={`text-xs font-black uppercase tracking-tight ${battle.winner_side === 'p2' ? 'text-white' : 'text-white/30'}`}>
                         {battle.p2?.username || battle.player2_guest_name}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-[10px] font-black italic uppercase tracking-widest mb-1
                    ${battle.winner_side === 'draw' ? 'text-white/40' : 
                      battle.winner_side === 'p1' ? 'text-[#E94560]' : 'text-[#4361EE]'}`}>
                    {battle.win_type?.replace('_', ' ')}
                  </div>
                  <div className="text-white font-black text-xl tracking-tighter leading-none italic">
                    {battle.points_p1} - {battle.points_p2}
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

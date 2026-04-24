import React, { useState, useEffect } from 'react';
import { Avatar } from '../Avatar';
import { UserCircle2, UserPlus, Search } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export function PlayerPicker({ battle, onChange, onNext }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [battle.player1.user_id]);

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_id, avatar_color')
      .neq('id', battle.player1.user_id);
    setUsers(data ?? []);
    setLoading(false);
  }

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const canProceed = battle.player2.user_id || (battle.player2.guest_name && battle.player2.guest_name.length >= 2);

  function selectUser(user) {
    onChange({
      ...battle,
      player2: { user_id: user.id, guest_name: null, combo_id: null },
    });
  }

  function setGuestName(name) {
    onChange({
      ...battle,
      player2: { user_id: null, guest_name: name, combo_id: null },
    });
  }

  return (
    <div className="space-y-6">
      <div className="text-white/60 text-sm font-medium">
        Chi è il tuo avversario?
      </div>

      {/* Search registered */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input
            type="text"
            placeholder="Cerca Blader registrato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white text-sm outline-none focus:border-primary/30 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
          {filteredUsers.map(u => {
            const selected = battle.player2.user_id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => selectUser(u)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all
                  ${selected
                    ? 'bg-[#E94560]/10 border-[#E94560]/50'
                    : 'bg-[#12122A] border-white/5 hover:border-white/15'}`}
              >
                <Avatar
                  avatarId={u.avatar_id}
                  size={44}
                />
                <div className="flex-1 text-left">
                  <div className="text-white font-bold text-sm tracking-tight">{u.username}</div>
                  <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Blader Registrato</div>
                </div>
                {selected && (
                  <div className="w-5 h-5 rounded-full bg-[#E94560] flex items-center justify-center border-2 border-[#E94560]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guest separator */}
      <div className="relative py-2 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/5"></div>
        </div>
        <span className="relative px-4 bg-[#0A0A1A] text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Oppure Ospite</span>
      </div>

      {/* Guest input */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#12122A] border border-white/5 focus-within:border-white/20 transition-colors">
        <UserPlus size={20} className="text-white/20" />
        <input
          type="text"
          placeholder="Nome dell'ospite"
          value={battle.player2.guest_name ?? ''}
          onChange={e => setGuestName(e.target.value)}
          className="flex-1 bg-transparent text-white text-sm font-bold outline-none placeholder-white/10"
        />
      </div>

      {/* Continue button */}
      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-4 rounded-2xl font-black tracking-[0.1em] text-white transition-all disabled:opacity-30 disabled:grayscale"
        style={{
          background: 'linear-gradient(135deg, #E94560, #C9304A)',
          boxShadow: canProceed ? '0 10px 25px -10px rgba(233,69,96,0.6)' : 'none',
        }}
      >
        CONTINUA
      </button>
    </div>
  );
}

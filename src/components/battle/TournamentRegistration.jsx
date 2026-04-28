import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';

export function TournamentRegistration({ tournament }) {
  const userId = useAuthStore(s => s.user?.id);
  const [registrations, setRegistrations] = useState([]);
  const [myDecks, setMyDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    loadData();
  }, [tournament.id, userId]);

  async function loadData() {
    const { data: regs } = await supabase
      .from('tournament_registrations')
      .select('*, user:user_id(username, avatar_id)')
      .eq('tournament_id', tournament.id);
    setRegistrations(regs ?? []);
    setIsRegistered((regs ?? []).some(r => r.user_id === userId));

    const { data: decks } = await supabase
      .from('decks')
      .select(`*, combo1:combo1_id(name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                   combo2:combo2_id(name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                   combo3:combo3_id(name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name))`)
      .eq('user_id', userId);
    setMyDecks(decks ?? []);
  }

  async function handleRegister() {
    if (!selectedDeck && tournament.battle_type === '3v3') return;

    await supabase.from('tournament_registrations').insert({
      tournament_id: tournament.id,
      user_id: userId,
      deck_id: selectedDeck,
    });

    loadData();
  }

  async function handleUnregister() {
    await supabase.from('tournament_registrations')
      .delete()
      .eq('tournament_id', tournament.id)
      .eq('user_id', userId);
    loadData();
  }

  if (!tournament.registration_open) return null;

  return (
    <div className="bg-[#12122A] rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-[#F5A623]" />
          <div className="text-[10px] font-bold text-[#F5A623] tracking-[0.15em]">
            ISCRIZIONI APERTE
          </div>
        </div>
        <div className="text-white/60 text-xs font-bold tabular-nums">
          {registrations.length} iscritti
        </div>
      </div>

      {/* Registered players list */}
      <div className="space-y-1.5 mb-4">
        {registrations.map(r => (
          <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <div className="text-white text-xs font-bold flex-1">
              {r.user?.username ?? 'Unknown'}
            </div>
            {r.deck_id && (
              <div className="text-[9px] text-[#00D68F] font-bold">DECK ✓</div>
            )}
          </div>
        ))}
      </div>

      {/* Registration action */}
      {isRegistered ? (
        <button
          onClick={handleUnregister}
          className="w-full py-3 rounded-xl bg-[#E94560]/10 border border-[#E94560]/30
            text-[#E94560] font-bold text-sm"
        >
          RITIRA ISCRIZIONE
        </button>
      ) : (
        <>
          {/* Deck selection (required for 3v3) */}
          {tournament.battle_type === '3v3' && (
            <div className="mb-3">
              <div className="text-[9px] font-bold text-white/40 tracking-wider mb-2">
                SELEZIONA IL TUO DECK
              </div>
              <div className="space-y-1.5">
                {myDecks.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDeck(d.id)}
                    className={`w-full p-2.5 rounded-lg border text-left transition-colors
                      ${selectedDeck === d.id
                        ? 'bg-[#F5A623]/10 border-[#F5A623]/50'
                        : 'bg-white/5 border-white/10'}`}
                  >
                    <div className="text-white font-bold text-xs">{d.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={tournament.battle_type === '3v3' && !selectedDeck}
            className="w-full py-3 rounded-xl font-bold text-sm text-white
              disabled:opacity-30 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #F5A623, #D48919)' }}
          >
            <UserPlus size={16} />
            ISCRIVITI AL TORNEO
          </button>
        </>
      )}
    </div>
  );
}

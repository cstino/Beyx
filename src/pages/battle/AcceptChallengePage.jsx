import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { DeckPicker } from '../../components/battle/DeckPicker';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { motion } from 'framer-motion';

export function AcceptChallengePage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);
  const setHeader = useUIStore(s => s.setHeader);
  const clearHeader = useUIStore(s => s.clearHeader);
  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHeader('ACCETTA SFIDA', '/battle');
    return () => clearHeader();
  }, []);

  useEffect(() => {
    fetchBattle();
  }, [battleId]);

  async function fetchBattle() {
    const { data, error } = await supabase
      .from('battles')
      .select(`
        *,
        p1:player1_user_id(username, avatar_id)
      `)
      .eq('id', battleId)
      .single();

    if (error || !data) {
      navigate('/battle');
      return;
    }

    // Map Supabase flat structure to the nested structure DeckPicker expects
    const formattedMatch = {
      ...data,
      player1: { user_id: data.player1_user_id, guest_name: data.player1_guest_name },
      player2: { user_id: data.player2_user_id, guest_name: data.player2_guest_name }
    };

    setBattle(formattedMatch);
    setLoading(false);
  }

  const handleConfirmDeck = async () => {
    // Il DeckPicker chiama onChange ogni volta che il deck cambia, 
    // aggiornando l'oggetto battle nello stato del genitore (NewMatchPage).
    // Qui dobbiamo assicurarci di inviare l'update finale.
    
    const { data, error } = await supabase
      .from('battles')
      .update({
        p2_deck_config: battle.p2_deck_config,
        status: 'active',
        played_at: new Date().toISOString()
      })
      .eq('id', battleId)
      .select();

    if (!error && data && data.length > 0) {
      navigate(`/battle/live/${battleId}`);
    } else {
      console.error("Update failed or blocked by RLS:", error);
      alert("Errore durante l'attivazione della sfida. Assicurati di avere i permessi necessari.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-24 px-4 pt-4">
      {/* Informazioni Match */}
      <div className="mb-8 px-2">
        <div className="text-[10px] font-bold tracking-[0.15em] text-primary uppercase mb-1 font-createfuture">Configura</div>
        <div className="text-white font-black text-lg uppercase italic font-createfuture">Scegli il tuo Deck</div>
      </div>

      <div className="mb-6 p-5 rounded-[32px] bg-primary/5 border border-primary/20 flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black italic text-xl">VS</div>
        <div>
          <div className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5 font-createfuture">Sfidante</div>
          <div className="text-sm font-black text-white uppercase italic font-createfuture">{battle.p1?.username}</div>
        </div>
      </div>

      <DeckPicker
        match={battle}
        isPlayer2={true}
        onChange={(updatedMatch) => {
          setBattle(updatedMatch);
        }}
        onStart={handleConfirmDeck}
      />
    </div>
  );
}

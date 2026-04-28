import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, LayoutGrid, X, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TournamentSetup } from '../../components/battle/TournamentSetup';
import { BracketView } from '../../components/battle/BracketView';
import { OutcomePicker } from '../../components/battle/OutcomePicker';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { Avatar } from '../../components/Avatar';

export default function NewTournamentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const setHeader = useUIStore(s => s.setHeader);
  const clearHeader = useUIStore(s => s.clearHeader);
  
  const [stage, setStage] = useState('setup'); // 'setup' | 'active'
  const [tournament, setTournament] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null); // { rIndex, mIndex }
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [loadingTournament, setLoadingTournament] = useState(true);
  const [blades, setBlades] = useState([]);
  const [ratchets, setRatchets] = useState([]);
  const [bits, setBits] = useState([]);

  useEffect(() => {
    fetchParts();
  }, []);

  async function fetchParts() {
    const [b, r, t] = await Promise.all([
      supabase.from('blades').select('*'),
      supabase.from('ratchets').select('*'),
      supabase.from('bits').select('*')
    ]);
    setBlades(b.data || []);
    setRatchets(r.data || []);
    setBits(t.data || []);
  }

  const getPartName = (type, id) => {
    if (!id) return '';
    if (type === 'blade') return blades.find(p => p.id === id)?.name || 'Unknown Blade';
    if (type === 'ratchet') return ratchets.find(p => p.id === id)?.name || 'Unknown Ratchet';
    if (type === 'bit') return bits.find(p => p.id === id)?.name || 'Unknown Bit';
    return '';
  };

  // Resume unfinished tournament if exists
  useEffect(() => {
    async function checkActiveTournament() {
      if (!user) {
        setLoadingTournament(false);
        return;
      }
      
      const targetId = location.state?.tournamentId;
      let query = supabase.from('tournaments').select('*').eq('created_by', user.id);
      
      if (targetId) {
        query = query.eq('id', targetId);
      } else {
        query = query.neq('status', 'completed').order('created_at', { ascending: false }).limit(1);
      }
      
      const { data, error } = await query.maybeSingle();

      if (data) {
        const structure = typeof data.structure === 'string' ? JSON.parse(data.structure) : data.structure;
        const rounds = structure.rounds || [];
        const finalRound = rounds[rounds.length - 1];
        const finalMatch = finalRound?.matches[0];
        
        if (finalMatch?.winner && data.status === 'active') {
          const winner = finalMatch.winner === 'p1' ? finalMatch.p1 : finalMatch.p2;
          const repaired = { ...data, structure, status: 'completed', winner_user_id: winner.user_id, winner_guest_name: winner.guest_name };
          setTournament(repaired);
          setStage('active'); 
          updateTournamentDB(repaired);
        } else {
          setTournament({ ...data, structure });
          // Se siamo venuti qui per gestire o se è un torneo in fase di iscrizione, andiamo direttamente alla gestione
          if (targetId || (data.status === 'setup' && data.registration_open)) {
            setStage('active');
          } else {
            setStage('setup'); 
          }
        }
      } else {
        // Se non troviamo nulla e avevamo un targetId, resettiamo
        setTournament(null);
        setStage('setup');
      }
      setLoadingTournament(false);
    }
    checkActiveTournament();
  }, [user, location.state?.tournamentId]);

  // Manage Global Header
  useEffect(() => {
    if (loadingTournament) return;
    setHeader((stage === 'setup' && !tournament) ? 'Crea Torneo' : (tournament?.name || 'Torneo'), '/battle');
    return () => clearHeader();
  }, [stage, tournament, setHeader, clearHeader, loadingTournament]);

  function generateBracket(participants) {
    const roundCount = Math.ceil(Math.log2(participants.length));
    const bracketSize = Math.pow(2, roundCount);
    
    // 1. Initial round with potential BYEs
    const firstRoundMatches = [];
    for (let i = 0; i < bracketSize / 2; i++) {
       const p1 = participants[i * 2] || { username: 'BYE', isBye: true };
       const p2 = participants[i * 2 + 1] || { username: 'BYE', isBye: true };
       
       let winner = null;
       if (p1.isBye) winner = 'p2';
       else if (p2.isBye) winner = 'p1';

       firstRoundMatches.push({ p1, p2, winner });
    }

    const rounds = [{ matches: firstRoundMatches }];
    let currentMatchCount = firstRoundMatches.length;
    let rIdx = 0;
    
    // 2. Generate subsequent rounds and handle BYE advancement
    while (currentMatchCount > 1) {
       currentMatchCount /= 2;
       const nextMatches = Array(currentMatchCount).fill(null).map(() => ({ p1: null, p2: null, winner: null }));
       
       // Advance winners from current round to next matches
       const currentMatches = rounds[rIdx].matches;
       currentMatches.forEach((m, mIdx) => {
         if (m.winner) {
           const nextMIdx = Math.floor(mIdx / 2);
           const winnerObj = m.winner === 'p1' ? m.p1 : m.p2;
           if (mIdx % 2 === 0) nextMatches[nextMIdx].p1 = winnerObj;
           else nextMatches[nextMIdx].p2 = winnerObj;
         }
       });

       // Check for new BYE-induced winners in the next matches
       nextMatches.forEach(m => {
          if (m.p1 && m.p2 && (m.p1.isBye || m.p2.isBye)) {
            m.winner = m.p1.isBye ? 'p2' : 'p1';
          }
       });

       rounds.push({ matches: nextMatches });
       rIdx++;
    }

    return { rounds };
  }

  function generateRoundRobin(participants) {
    const list = [...participants];
    if (list.length % 2 !== 0) list.push({ username: 'FREE ROUND', isBye: true });
    
    const roundsCount = list.length - 1;
    const matchesPerRound = list.length / 2;
    const rounds = [];

    for (let j = 0; j < roundsCount; j++) {
      const matches = [];
      for (let i = 0; i < matchesPerRound; i++) {
        const p1 = list[i];
        const p2 = list[list.length - 1 - i];
        matches.push({ p1, p2, winner: null });
      }
      rounds.push({ matches });
      list.splice(1, 0, list.pop());
    }

    return { rounds };
  }

  async function deleteTournament() {
    if (!tournament || !window.confirm("Sei sicuro di voler eliminare definitivamente questo torneo?")) return;
    
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournament.id);

    if (error) {
      alert("Errore durante l'eliminazione: " + error.message);
    } else {
      setTournament(null);
      setStage('setup');
      navigate('/battle');
    }
  }

  async function handleCreate(config) {
    const name = config.name || `Torneo ${new Date().toLocaleDateString()}`;
    const structure = config.registrationOpen ? { rounds: [] } : (config.format === 'bracket' 
      ? generateBracket(config.participants) 
      : generateRoundRobin(config.participants));

    const { data, error } = await supabase.from('tournaments').insert({
      name: name,
      format: config.format,
      battle_type: config.battleType,
      participants: config.participants || [],
      structure: structure,
      registration_open: config.registrationOpen,
      max_participants: config.maxParticipants,
      description: config.description,
      created_by: user.id,
      status: 'setup'
    }).select().single();

    if (error) {
      console.error('Error creating tournament:', error);
      return;
    }
    setTournament(data);
    setStage('active');
  }

  async function handleMatchWin() {
    if (!activeMatch) {
      // Emergenza: se non c'è un match attivo ma forziamo la chiusura
      const finalRound = tournament.structure.rounds[tournament.structure.rounds.length - 1];
      const finalMatch = finalRound.matches[0];
      if (finalMatch.winner) {
        const winner = finalMatch.winner === 'p1' ? finalMatch.p1 : finalMatch.p2;
        const updated = { ...tournament, status: 'completed', winner_user_id: winner.user_id, winner_guest_name: winner.guest_name };
        setTournament(updated);
        updateTournamentDB(updated);
      }
      return;
    }
    const { rIndex, mIndex } = activeMatch;
    const newStructure = JSON.parse(JSON.stringify(tournament.structure));
    const currentMatch = newStructure.rounds[rIndex].matches[mIndex];
    
    const winnerSide = p1Score > p2Score ? 'p1' : (p2Score > p1Score ? 'p2' : 'draw');
    if (winnerSide === 'draw') return;

    currentMatch.winner = winnerSide;
    currentMatch.score = { p1: p1Score, p2: p2Score };
    const winner = winnerSide === 'p1' ? currentMatch.p1 : currentMatch.p2;

    // Prepare data for the ranked record
    const battleRecord = {
       format: 'tournament', // Usiamo 'tournament' come formato per consistenza nella cronologia
       is_official: true,
       tournament_id: tournament.id,
       player1_user_id: currentMatch.p1.user_id || null,
       player1_guest_name: currentMatch.p1.user_id ? null : currentMatch.p1.username,
       player2_user_id: currentMatch.p2.user_id || null,
       player2_guest_name: currentMatch.p2.user_id ? null : currentMatch.p2.username,
       winner_side: winnerSide,
       points_p1: parseInt(p1Score) || 0,
       points_p2: parseInt(p2Score) || 0,
       created_by: user.id
    };

    const { error: battleError } = await supabase.from('battles').insert(battleRecord);
    if (battleError) console.error('Battle insert error:', battleError);

    let updatedStatus = tournament.status;
    let winnerUserId = null;
    let winnerGuestName = null;

    if (tournament.format === 'bracket') {
      if (rIndex < newStructure.rounds.length - 1) {
         let currentR = rIndex;
         let currentM = mIndex;
         let currentWinner = winner;

         while (currentR < newStructure.rounds.length - 1) {
            const nextR = currentR + 1;
            const nextM = Math.floor(currentM / 2);
            
            if (currentM % 2 === 0) newStructure.rounds[nextR].matches[nextM].p1 = currentWinner;
            else newStructure.rounds[nextR].matches[nextM].p2 = currentWinner;

            const nextMatch = newStructure.rounds[nextR].matches[nextM];
            if (nextMatch.p1 && nextMatch.p2 && (nextMatch.p1.isBye || nextMatch.p2.isBye)) {
               nextMatch.winner = nextMatch.p1.isBye ? 'p2' : 'p1';
               currentWinner = nextMatch.winner === 'p1' ? nextMatch.p1 : nextMatch.p2;
               currentR = nextR;
               currentM = nextM;
            } else break;
         }
      } else {
         updatedStatus = 'completed';
         winnerUserId = winner.user_id;
         winnerGuestName = winner.guest_name;
      }
    }

    const updatedTournament = { 
      ...tournament, 
      structure: newStructure, 
      status: updatedStatus,
      winner_user_id: winnerUserId,
      winner_guest_name: winnerGuestName
    };

    setTournament(updatedTournament);
    setActiveMatch(null);
    setP1Score(0);
    setP2Score(0);
    updateTournamentDB(updatedTournament);
  }

  async function updateTournamentDB(t) {
    await supabase.from('tournaments')
      .update({ 
        structure: t.structure, 
        status: t.status, 
        winner_user_id: t.winner_user_id, 
        winner_guest_name: t.winner_guest_name,
        completed_at: t.status === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', t.id);
  }

  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    if (tournament?.registration_open && tournament?.status === 'setup') {
      fetchRegistrations();
      const sub = supabase.channel('registrations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_registrations', filter: `tournament_id=eq.${tournament.id}` }, fetchRegistrations)
        .subscribe();
      return () => supabase.removeChannel(sub);
    }
  }, [tournament]);

  async function fetchRegistrations() {
    const { data } = await supabase
      .from('tournament_registrations')
      .select('*, profiles(username, avatar_id, avatar_color)')
      .eq('tournament_id', tournament.id);
    setRegistrations(data || []);
  }

  async function handleRegistrationStatus(regId, newStatus) {
    await supabase.from('tournament_registrations').update({ status: newStatus }).eq('id', regId);
    fetchRegistrations();
  }

  async function startFromRegistrations() {
    const approved = registrations.filter(r => r.status === 'approved').map(r => ({
      user_id: r.user_id,
      username: r.profiles.username,
      seed: 0,
      deck: r.deck_config
    }));
    
    if (approved.length < 2) return;
    
    const structure = tournament.format === 'bracket' ? generateBracket(approved) : generateRoundRobin(approved);
    const updated = { 
       ...tournament, 
       participants: approved, 
       structure, 
       registration_open: false,
       status: 'active'
    };
    
    setTournament(updated);
    updateTournamentDB(updated);
  }

  if (loadingTournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A1A]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function archiveCurrentAndNew() {
    if (tournament) {
      await supabase.from('tournaments').update({ status: 'completed' }).eq('id', tournament.id);
    }
    setTournament(null);
    setStage('setup');
  }

  return (
    <div className="min-h-screen pb-32 flex flex-col pt-6">
      <div className="px-6 flex-1">
         {stage === 'setup' ? (
           <>
             {tournament && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                 className="mb-8 p-6 bg-primary/10 border border-primary/20 rounded-[32px] flex flex-col gap-4"
               >
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                     <Trophy size={20} />
                   </div>
                   <div>
                     <div className="text-[10px] font-black text-primary uppercase tracking-widest">Torneo in corso</div>
                     <div className="text-sm font-black text-white uppercase italic">{tournament.name}</div>
                   </div>
                 </div>
                 <div className="flex gap-2 mt-2">
                   <button 
                     onClick={() => setStage('active')}
                     className="flex-1 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-glow-primary"
                   >
                     Riprendi
                   </button>
                   <button 
                     onClick={archiveCurrentAndNew}
                     className="flex-1 py-3 bg-white/5 border border-white/10 text-white/60 font-black uppercase text-[10px] tracking-widest rounded-xl"
                   >
                     Nuovo
                   </button>
                 </div>
               </motion.div>
             )}
             <TournamentSetup onConfirm={handleCreate} />
           </>
         ) : tournament?.status === 'setup' && tournament?.registration_open ? (
           <div className="space-y-8">
              <div>
                <div className="text-[10px] font-black text-primary tracking-[0.2em] mb-2 uppercase">Iscrizioni Aperte</div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{tournament.name}</h2>
                <p className="text-white/40 text-xs mt-2 font-medium">{tournament.description || 'Nessuna descrizione.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Posti Occupati</div>
                    <div className="text-xl font-black text-white">{registrations.filter(r => r.status === 'approved').length} / {tournament.max_participants}</div>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">In Attesa</div>
                    <div className="text-xl font-black text-primary">{registrations.filter(r => r.status === 'pending').length}</div>
                 </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-[11px] font-black text-white tracking-widest uppercase">Richieste ({registrations.length})</h3>
                 <div className="space-y-3">
                    {registrations.map(reg => (
                      <div key={reg.id} className="p-5 bg-[#12122A] rounded-3xl border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <Avatar avatarId={reg.profiles.avatar_id} size={36} />
                             <div className="text-sm font-black text-white uppercase italic">{reg.profiles.username}</div>
                          </div>
                          <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${reg.status === 'approved' ? 'bg-green-500/10 text-green-500' : reg.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-white/10 text-white/40'}`}>
                            {reg.status}
                          </div>
                        </div>

                        {/* Deck Preview */}
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                           <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">Match Deck ({reg.deck_config?.beys?.length} Bey)</div>
                           <div className="flex gap-2">
                             {reg.deck_config?.beys?.map((b, bi) => (
                                <div key={bi} className="flex-1 min-w-0 h-24 py-3 px-3 rounded-2xl bg-[#0A0A1A] border border-white/5 flex flex-col justify-between">
                                   <div>
                                      <div className="text-[7px] font-black text-primary uppercase mb-0.5">Bey {bi+1}</div>
                                      <div className="text-[10px] font-black text-white uppercase italic truncate">
                                        {b.blade_id ? getPartName('blade', b.blade_id) : "Vuoto"}
                                      </div>
                                   </div>
                                   <div className="text-[8px] font-bold text-white/30 uppercase leading-tight line-clamp-2">
                                     {b.blade_id ? (() => {
                                       const blade = blades.find(p => p.id === b.blade_id);
                                       if (b.is_stock) return `${blade?.stock_ratchet || ''} ${blade?.stock_bit || ''}`;
                                       return `${getPartName('ratchet', b.ratchet_id)} ${getPartName('bit', b.bit_id)}`;
                                     })() : '-'}
                                   </div>
                                </div>
                             ))}
                           </div>
                        </div>

                        {reg.status === 'pending' && (
                          <div className="flex gap-2">
                             <button 
                               onClick={() => handleRegistrationStatus(reg.id, 'approved')}
                               className="flex-1 py-3 bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest"
                             >Approva</button>
                             <button 
                               onClick={() => handleRegistrationStatus(reg.id, 'rejected')}
                               className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] font-black text-white/40 uppercase tracking-widest"
                             >Rifiuta</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {registrations.length === 0 && <div className="py-12 text-center text-white/10 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-white/5 rounded-3xl">Nessuna richiesta per ora</div>}
                 </div>
              </div>

              <button 
                onClick={startFromRegistrations}
                disabled={registrations.filter(r => r.status === 'approved').length < 2}
                className="w-full py-5 bg-primary rounded-[22px] text-white font-black uppercase text-[11px] tracking-widest shadow-glow-primary disabled:opacity-20"
              >
                Genera Tabellone e Inizia
              </button>

              <button 
                onClick={deleteTournament}
                className="w-full py-4 text-white/20 hover:text-red-500/50 text-[9px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Elimina Torneo
              </button>
           </div>
         ) : tournament?.status === 'completed' ? (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="flex flex-col items-center justify-center pt-20 text-center"
           >
             <div className="w-24 h-24 bg-gradient-to-br from-[#F5A623] to-[#FF7E5F] rounded-full flex items-center justify-center mb-6 shadow-glow-primary">
               <Trophy size={48} className="text-white drop-shadow-lg" />
             </div>
             <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">CAMPIONE!</h2>
             <p className="text-white/40 font-bold uppercase tracking-[0.2em] mb-12">Il torneo è concluso</p>
             
             <div className="bg-[#12122A] border border-[#F5A623]/30 p-8 rounded-[32px] w-full mb-12 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-[#F5A623]" />
               <div className="text-[10px] font-black text-[#F5A623] tracking-widest uppercase mb-4 italic">Vincitore</div>
               <div className="text-3xl font-black text-white uppercase italic tracking-tighter">
                 {tournament.winner_user_id ? (tournament.participants.find(p => p.user_id === tournament.winner_user_id)?.username) : tournament.winner_guest_name}
               </div>
             </div>

             <button 
               onClick={() => navigate('/battle')}
               className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase text-[11px] tracking-widest hover:bg-white/10 transition-all"
             >
               Chiudi e Torna ai Match
             </button>
           </motion.div>
         ) : (
           <>
             <BracketView 
               tournament={tournament} 
               onSelectMatch={(rIndex, mIndex) => setActiveMatch({ rIndex, mIndex })}
             />
             {/* Bottone di emergenza se la riparazione automatica fallisce */}
             {tournament.structure?.rounds?.[tournament.structure.rounds.length - 1]?.matches[0]?.winner && (
               <div className="px-6 mt-8">
                 <button 
                   onClick={() => handleMatchWin({ 
                     winner_side: tournament.structure.rounds[tournament.structure.rounds.length - 1].matches[0].winner,
                     win_type: 'final'
                   })}
                   className="w-full py-4 bg-primary/20 border border-primary/40 rounded-2xl text-primary font-black uppercase text-[11px] tracking-widest shadow-glow-primary"
                 >
                   Finalizza Torneo Manualmente
                 </button>
               </div>
             )}
              {/* Bottone Elimina Torneo (Anche se attivo) */}
              <div className="px-6 mt-12 mb-8">
                 <button 
                  onClick={deleteTournament}
                  className="w-full py-4 text-white/10 hover:text-red-500/30 text-[9px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2"
                 >
                   <Trash2 size={14} /> Annulla ed Elimina Torneo
                 </button>
              </div>
           </>
         )}
      </div>

      <AnimatePresence>
        {activeMatch && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#0A0A1A] flex flex-col pt-12"
          >
            <div className="flex justify-between items-center px-6 mb-12">
               <h3 className="text-white font-black italic uppercase tracking-tight">Risultato Match</h3>
               <button onClick={() => setActiveMatch(null)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20"><X size={20} /></button>
            </div>
            
            <div className="flex-1 px-6">
               <div className="bg-[#12122A] rounded-3xl p-8 border border-white/5 flex flex-col items-center">
                  <div className="flex items-center justify-around w-full mb-12">
                     <div className="text-center">
                        <div className="text-[10px] font-black text-primary tracking-widest uppercase mb-4 opacity-50">Score P1</div>
                        <input 
                          type="number" 
                          value={p1Score} 
                          onChange={(e) => setP1Score(parseInt(e.target.value) || 0)}
                          className="w-20 bg-white/5 border-2 border-white/10 rounded-2xl h-20 text-center text-3xl font-black text-white focus:border-primary outline-none"
                        />
                        <div className="mt-4 text-[11px] font-black text-white/60 uppercase truncate w-24">
                          {tournament.structure.rounds[activeMatch.rIndex].matches[activeMatch.mIndex].p1.username}
                        </div>
                     </div>

                     <div className="text-white/10 font-black text-2xl italic mt-10">VS</div>

                     <div className="text-center">
                        <div className="text-[10px] font-black text-[#4361EE] tracking-widest uppercase mb-4 opacity-50">Score P2</div>
                        <input 
                          type="number" 
                          value={p2Score} 
                          onChange={(e) => setP2Score(parseInt(e.target.value) || 0)}
                          className="w-20 bg-white/5 border-2 border-white/10 rounded-2xl h-20 text-center text-3xl font-black text-white focus:border-[#4361EE] outline-none"
                        />
                        <div className="mt-4 text-[11px] font-black text-white/60 uppercase truncate w-24">
                          {tournament.structure.rounds[activeMatch.rIndex].matches[activeMatch.mIndex].p2.username}
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={handleMatchWin}
                    disabled={p1Score === p2Score}
                    className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase text-[11px] tracking-widest shadow-glow-primary disabled:opacity-30"
                  >
                    Salva Risultato Torneo
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

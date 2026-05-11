import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, LayoutGrid, X, Trash2, Zap, Target, Flame, RotateCcw, Minus, Plus, Check, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TournamentSetup } from '../../components/battle/TournamentSetup';
import { BracketView } from '../../components/battle/BracketView';
import { OutcomePicker } from '../../components/battle/OutcomePicker';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { Avatar } from '../../components/Avatar';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToastStore } from '../../store/useToastStore';

export default function NewTournamentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const setHeader = useUIStore(s => s.setHeader);
  const clearHeader = useUIStore(s => s.clearHeader);
  
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [stage, setStage] = useState('setup'); // 'setup' | 'active'
  const [tournament, setTournament] = useState(null);
  const [loadingTournament, setLoadingTournament] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
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
      let query = supabase.from('tournaments').select('*');
      
      if (targetId) {
        query = query.eq('id', targetId);
      } else {
        // Se non c'è un ID specifico, cerchiamo l'ultimo creato dall'utente non concluso
        query = query.eq('created_by', user.id).neq('status', 'completed').order('created_at', { ascending: false }).limit(1);
      }
      
      const { data, error } = await query.maybeSingle();

      if (data) {
        setIsReadOnly(data.created_by !== user.id);
        const structure = typeof data.structure === 'string' ? JSON.parse(data.structure) : data.structure;
        const rounds = structure.rounds || [];
        const finalRound = rounds[rounds.length - 1];
        const finalMatch = finalRound?.matches[0];
        
        if (finalMatch?.winner && data.status === 'active' && data.created_by === user.id) {
          const winner = finalMatch.winner === 'p1' ? finalMatch.p1 : finalMatch.p2;
          const repaired = { ...data, structure, status: 'completed', winner_user_id: winner.user_id, winner_guest_name: winner.guest_name };
          setTournament(repaired);
          setStage('active'); 
          updateTournamentDB(repaired);
        } else if (data.format === 'round_robin' && structure.settings?.rrWinnerMode === 'points' && data.status === 'active') {
          // Check if all rounds are complete for points-based RR
          const allComplete = structure.rounds.every(r => r.matches.every(m => m.winner));
          if (allComplete) {
            const standings = calculateStandings({ ...data, structure });
            const winner = standings[0];
            const repaired = { ...data, structure, status: 'completed', winner_user_id: winner.user_id, winner_guest_name: winner.guest_name || winner.username };
            setTournament(repaired);
            setStage('active');
            updateTournamentDB(repaired);
          } else {
            setTournament({ ...data, structure });
            if (targetId || (data.status === 'setup' && data.registration_open)) setStage('active');
          }
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
        setTournament(null);
        setStage('setup');
      }
      setLoadingTournament(false);
    }
    checkActiveTournament();
    
    // Add Realtime subscription for tournament updates
    const targetId = location.state?.tournamentId;
    if (targetId) {
      const channel = supabase.channel(`tournament-${targetId}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'tournaments', 
          filter: `id=eq.${targetId}` 
        }, (payload) => {
          const updated = payload.new;
          const structure = typeof updated.structure === 'string' ? JSON.parse(updated.structure) : updated.structure;
          setTournament({ ...updated, structure });
        })
        .subscribe();
        
      return () => supabase.removeChannel(channel);
    }
  }, [user, location.state?.tournamentId]);

  function calculateStandings(t) {
    const participants = t.participants || [];
    const rounds = t.structure.rounds || [];
    
    const stats = participants.filter(p => !p.isBye).map(p => ({
      ...p,
      played: 0,
      won: 0,
      lost: 0,
      points: 0
    }));

    rounds.forEach(r => {
      if (r.isPlayoff) return;
      r.matches.forEach(m => {
        if (m.winner) {
          const p1Id = m.p1.user_id || m.p1.username;
          const p2Id = m.p2.user_id || m.p2.username;
          
          const s1 = stats.find(s => (s.user_id || s.username) === p1Id);
          const s2 = stats.find(s => (s.user_id || s.username) === p2Id);
          
          if (s1) s1.played++;
          if (s2) s2.played++;
          
          if (m.winner === 'p1') {
            if (s1) { s1.won++; s1.points += 3; }
            if (s2) { s2.lost++; }
          } else {
            if (s2) { s2.won++; s2.points += 3; }
            if (s1) { s1.lost++; }
          }
        }
      });
    });

    return stats.sort((a, b) => b.points - a.points || b.won - a.won);
  }

  async function startPlayoffs() {
    const standings = calculateStandings(tournament);
    const type = tournament.structure.settings?.playoffType;
    const newRounds = [...tournament.structure.rounds];
    
    if (type === 'final') {
      newRounds.push({
        isPlayoff: true,
        title: 'Finale',
        matches: [{ p1: standings[0], p2: standings[1], winner: null }]
      });
    } else if (type === 'semi') {
      newRounds.push(
        {
          isPlayoff: true,
          title: 'Semifinali',
          matches: [
            { p1: standings[0], p2: standings[3], winner: null },
            { p1: standings[1], p2: standings[2], winner: null }
          ]
        },
        {
          isPlayoff: true,
          title: 'Finale',
          matches: [{ p1: null, p2: null, winner: null }]
        }
      );
    } else if (type === 'play_in') {
      newRounds.push(
        {
          isPlayoff: true,
          title: 'Play-In',
          matches: [
            { p1: standings[2], p2: standings[5], winner: null },
            { p1: standings[3], p2: standings[4], winner: null }
          ]
        },
        {
          isPlayoff: true,
          title: 'Semifinali',
          matches: [
            { p1: standings[0], p2: null, winner: null },
            { p1: standings[1], p2: null, winner: null }
          ]
        },
        {
          isPlayoff: true,
          title: 'Finale',
          matches: [{ p1: null, p2: null, winner: null }]
        }
      );
    }

    const updated = {
      ...tournament,
      structure: { ...tournament.structure, rounds: newRounds }
    };
    setTournament(updated);
    await updateTournamentDB(updated);
    useToastStore.getState().success("Playoff generati!");
  }

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

  function generateRoundRobin(participants, cycles = 1) {
    const list = [...participants];
    if (list.length % 2 !== 0) list.push({ username: 'FREE ROUND', isBye: true });
    
    const roundsCount = list.length - 1;
    const matchesPerRound = list.length / 2;
    const allRounds = [];

    for (let c = 0; c < cycles; c++) {
      const cycleList = [...list];
      for (let j = 0; j < roundsCount; j++) {
        const matches = [];
        for (let i = 0; i < matchesPerRound; i++) {
          const p1 = cycleList[i];
          const p2 = cycleList[cycleList.length - 1 - i];
          // Swap p1/p2 in alternate cycles for home/away effect
          if (c % 2 === 1) {
            matches.push({ p1: p2, p2: p1, winner: null });
          } else {
            matches.push({ p1, p2, winner: null });
          }
        }
        allRounds.push({ matches, cycle: c + 1, roundInCycle: j + 1 });
        cycleList.splice(1, 0, cycleList.pop());
      }
    }

    return { rounds: allRounds };
  }

  async function deleteTournament() {
    if (!tournament) return;
    setShowConfirmDelete(true);
  }

  async function handleConfirmedDelete() {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournament.id);

    if (error) {
      useToastStore.getState().error("Errore eliminazione: " + error.message);
    } else {
      setTournament(null);
      setStage('setup');
      navigate('/battle');
    }
  }

  async function handleCreate(config) {
    const name = config.name || `Torneo ${new Date().toLocaleDateString()}`;
    
    // All tournaments now start with registration_open: true 
    // to allow deck selection, even if by invitation.
    const { data, error } = await supabase.from('tournaments').insert({
      name: name,
      format: config.format,
      battle_type: config.battleType,
      participants: config.participants || [],
      structure: { 
        rounds: [], 
        settings: {
          rrCycles: config.rrCycles || 1,
          rrWinnerMode: config.rrWinnerMode || 'points',
          playoffType: config.playoffType || null
        }
      },
      registration_open: true,
      registration_mode: (config.registrationMode === 'invitation' ? 'manual' : 'open'),
      max_participants: config.maxParticipants,
      description: config.description,
      created_by: user.id,
      status: 'setup'
    }).select().single();

    if (error) {
      console.error('Error creating tournament:', error);
      useToastStore.getState().error("Errore creazione: " + error.message);
      return;
    }

    // If invitation mode, pre-register the invited users (not guests) as pending
    if (config.registrationMode === 'invitation' && config.participants?.length > 0) {
      const userInvites = config.participants
        .filter(p => p.user_id)
        .map(p => ({
          tournament_id: data.id,
          user_id: p.user_id,
          status: 'pending'
        }));
      
      if (userInvites.length > 0) {
        await supabase.from('tournament_registrations').insert(userInvites);
      }
    }

    setTournament(data);
    setStage('active');
    useToastStore.getState().success("Torneo creato con successo!");
  }

  async function handleSelectMatch(rIndex, mIndex) {
    const match = tournament.structure.rounds[rIndex].matches[mIndex];
    if (!match.p1 || !match.p2 || match.winner) return;

    // Check if we already have a battle_id for this match
    let battleId = match.battle_id;

    if (!battleId) {
      // Create a new active battle for this tournament match
      const { data: battleData, error: battleError } = await supabase.from('battles').insert({
        format: 'tournament',
        is_official: true,
        tournament_id: tournament.id,
        player1_user_id: match.p1.user_id || null,
        player1_guest_name: match.p1.user_id ? null : match.p1.username,
        player2_user_id: match.p2.user_id || null,
        player2_guest_name: match.p2.user_id ? null : match.p2.username,
        p1_deck_config: match.p1.deck,
        p2_deck_config: match.p2.deck,
        status: 'active',
        point_target: tournament.format === 'bracket' ? 3 : 5, // Custom targets could be added later
        created_by: user.id
      }).select().single();

      if (battleError) {
        console.error('Battle creation error:', battleError);
        useToastStore.getState().error("Errore creazione match: " + battleError.message);
        return;
      }

      battleId = battleData.id;

      // Update tournament structure with this battle_id
      const newStructure = JSON.parse(JSON.stringify(tournament.structure));
      newStructure.rounds[rIndex].matches[mIndex].battle_id = battleId;
      
      const updatedTournament = { ...tournament, structure: newStructure };
      setTournament(updatedTournament);
      await updateTournamentDB(updatedTournament);
    }

    // Navigate to the live match page
    navigate(`/battle/live/${battleId}`);
  }

  // Handle Playoff Advancement
  useEffect(() => {
    if (tournament?.status === 'active' && tournament.format === 'round_robin') {
      const structure = tournament.structure;
      const rounds = structure.rounds;
      let changed = false;
      const newRounds = JSON.parse(JSON.stringify(rounds));

      for (let i = 0; i < newRounds.length - 1; i++) {
        const currentRound = newRounds[i];
        if (!currentRound.isPlayoff) continue;
        
        const nextRound = newRounds[i+1];
        if (!nextRound || !nextRound.isPlayoff) continue;

        currentRound.matches.forEach((m, mIdx) => {
          if (m.winner) {
            const winnerObj = m.winner === 'p1' ? m.p1 : m.p2;
            
            if (currentRound.title === 'Play-In') {
              // In Play-In, Match 0 winner goes to Semi 0 P2, Match 1 winner goes to Semi 1 P2
              if (nextRound.matches[mIdx] && (!nextRound.matches[mIdx].p2 || nextRound.matches[mIdx].p2.username !== winnerObj.username)) {
                nextRound.matches[mIdx].p2 = winnerObj;
                changed = true;
              }
            } else {
              // Standard bracket advancement
              const nextMIdx = Math.floor(mIdx / 2);
              const isP1 = mIdx % 2 === 0;
              
              if (isP1 && (!nextRound.matches[nextMIdx].p1 || nextRound.matches[nextMIdx].p1.username !== winnerObj.username)) {
                nextRound.matches[nextMIdx].p1 = winnerObj;
                changed = true;
              } else if (!isP1 && (!nextRound.matches[nextMIdx].p2 || nextRound.matches[nextMIdx].p2.username !== winnerObj.username)) {
                nextRound.matches[nextMIdx].p2 = winnerObj;
                changed = true;
              }
            }
          }
        });
      }

      // Special case for play-in to semi-final advancement if needed (more complex logic might be needed)
      // For now semi and final are covered by the loop above.

      if (changed) {
        const updated = { ...tournament, structure: { ...structure, rounds: newRounds } };
        setTournament(updated);
        updateTournamentDB(updated);
      }

      // Check for completion of round_robin playoff final
      const finalRound = newRounds[newRounds.length - 1];
      if (finalRound?.isPlayoff && finalRound.matches[0].winner) {
        const winner = finalRound.matches[0].winner === 'p1' ? finalRound.matches[0].p1 : finalRound.matches[0].p2;
        const completed = { ...tournament, status: 'completed', winner_user_id: winner.user_id, winner_guest_name: winner.guest_name || winner.username };
        setTournament(completed);
        updateTournamentDB(completed);
      }
    }
  }, [tournament?.structure?.rounds]);

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

  // Sync tournament data if it updates via realtime
  useEffect(() => {
    if (tournament) {
      // Nothing specific to sync now as matches are handled externally
    }
  }, [tournament]);

  async function fetchRegistrations() {
    const { data } = await supabase
      .from('tournament_registrations')
      .select('*, profiles(id, username, avatar_id, avatar_color)')
      .eq('tournament_id', tournament.id);
    
    if (data) {
      setRegistrations(data);
      // Se il torneo è attivo, proviamo a riparare i nomi "Sconosciuto" nella struttura
      if (tournament.status === 'active') {
        const profileMap = {};
        data.forEach(r => {
          if (r.profiles) profileMap[r.user_id] = r.profiles.username;
        });
        cleanTournamentStructure(profileMap);
      }
    }
  }

  function cleanTournamentStructure(profileMap) {
    let changed = false;
    const newStructure = JSON.parse(JSON.stringify(tournament.structure));
    
    newStructure.rounds.forEach(r => {
      r.matches.forEach(m => {
        if (m.p1?.user_id && (m.p1.username === 'Sconosciuto' || !m.p1.username)) {
          const realName = profileMap[m.p1.user_id];
          if (realName && realName !== 'Sconosciuto') {
            m.p1.username = realName;
            changed = true;
          }
        }
        if (m.p2?.user_id && (m.p2.username === 'Sconosciuto' || !m.p2.username)) {
          const realName = profileMap[m.p2.user_id];
          if (realName && realName !== 'Sconosciuto') {
            m.p2.username = realName;
            changed = true;
          }
        }
      });
    });

    if (changed) {
      const updated = { ...tournament, structure: newStructure };
      setTournament(updated);
      updateTournamentDB(updated);
    }
  }

  useEffect(() => {
    if (tournament && tournament.status === 'active') {
      // Fetch registrations even if active to sync names
      fetchRegistrations();
    }
  }, [tournament?.id, tournament?.status]);

  async function handleRegistrationStatus(regId, newStatus) {
    await supabase.from('tournament_registrations').update({ status: newStatus }).eq('id', regId);
    fetchRegistrations();
  }

  async function startFromRegistrations() {
    // Collect approved users from registrations
    const approved = registrations.filter(r => r.status === 'approved').map(r => ({
      user_id: r.user_id,
      username: r.profiles?.username || 'Sconosciuto',
      seed: 0,
      deck: r.deck_config
    }));
    
    // Add guests from the original participants list (they don't have registrations)
    const guests = (tournament.participants || []).filter(p => !p.user_id).map(p => ({
      ...p,
      seed: 0,
      deck: null // Creator will handle guest beys during match
    }));

    const finalParticipants = [...approved, ...guests];
    
    if (finalParticipants.length < 2) {
      useToastStore.getState().error("Servono almeno 2 partecipanti confermati");
      return;
    }
    
    const structure = tournament.format === 'bracket' 
      ? generateBracket(finalParticipants) 
      : generateRoundRobin(finalParticipants, tournament.structure.settings?.rrCycles || 1);
    
    // Preserve settings in structure
    structure.settings = tournament.structure.settings;

    const updated = { 
       ...tournament, 
       participants: finalParticipants, 
       structure, 
       registration_open: false,
       status: 'active'
    };
    
    setTournament(updated);
    updateTournamentDB(updated);
    useToastStore.getState().success("Torneo avviato!");
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
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Confermati</div>
                    <div className="text-xl font-black text-white">
                      {registrations.filter(r => r.status === 'approved').length + (tournament.participants?.filter(p => !p.user_id).length || 0)} / {tournament.max_participants}
                    </div>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">In Attesa</div>
                    <div className="text-xl font-black text-primary">{registrations.filter(r => r.status === 'pending').length}</div>
                 </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-[11px] font-black text-white tracking-widest uppercase">Partecipanti</h3>
                 <div className="space-y-3">
                    {/* Show Guests First as they are already confirmed */}
                    {tournament.participants?.filter(p => !p.user_id).map((guest, gi) => (
                       <div key={`guest-${gi}`} className="p-5 bg-[#12122A] rounded-3xl border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                                <Users size={16} />
                             </div>
                             <div className="text-sm font-black text-white uppercase italic">
                               {guest.username} <span className="text-[8px] text-white/20 not-italic ml-1">(OSPITE)</span>
                             </div>
                          </div>
                          <div className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-[8px] font-black uppercase">
                            Confermato
                          </div>
                       </div>
                    ))}
                    {registrations.map(reg => (
                      <div key={reg.id} className="p-5 bg-[#12122A] rounded-3xl border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <Avatar 
                               avatarId={reg.profiles?.avatar_id || 'avatar-1'} 
                               avatarColor={reg.profiles?.avatar_color}
                               size={36} 
                             />
                             <div className="text-sm font-black text-white uppercase italic">
                               {reg.profiles?.username || (reg.user_id ? 'Caricamento...' : 'Sconosciuto')}
                             </div>
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
                                 <div key={bi} className="flex-1 min-w-0 h-[76px] py-2 px-3 rounded-2xl bg-[#0A0A1A] border border-white/5 flex flex-col justify-center">
                                    <div className="mb-1">
                                       <div className="text-[7px] font-black text-primary uppercase mb-0.5">Bey {bi+1}</div>
                                       <div className="marquee-container">
                                         <div className="text-[10px] font-black text-white uppercase italic animate-marquee">
                                           {b.blade_id ? getPartName('blade', b.blade_id) : "Vuoto"}
                                         </div>
                                       </div>
                                    </div>
                                    <div className="text-[8px] font-bold text-white/30 uppercase leading-tight line-clamp-1">
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

                        {reg.status === 'pending' && !isReadOnly && (
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
                    {registrations.length === 0 && (tournament.participants?.filter(p => !p.user_id).length || 0) === 0 && (
                      <div className="py-12 text-center text-white/10 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-white/5 rounded-3xl">Nessuna richiesta per ora</div>
                    )}
                 </div>
              </div>

              {!isReadOnly && (
                <>
                  <button 
                    onClick={startFromRegistrations}
                    disabled={(registrations.filter(r => r.status === 'approved').length + (tournament.participants?.filter(p => !p.user_id).length || 0)) < 2}
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
                </>
              )}
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
            <div className="p-8 pb-32 overflow-y-auto no-scrollbar">
              <BracketView 
                tournament={tournament} 
                onSelectMatch={(rIndex, mIndex) => {
                  if (isReadOnly) return;
                  handleSelectMatch(rIndex, mIndex);
                }}
              />
              {tournament.format === 'round_robin' && 
                tournament.structure.settings?.rrWinnerMode === 'playoff' && 
                !tournament.structure.rounds.some(r => r.isPlayoff) && 
                tournament.structure.rounds.every(r => r.matches.every(m => m.winner)) && (
                  <div className="mt-8 px-6">
                    <button 
                      onClick={startPlayoffs}
                      className="w-full py-5 bg-primary rounded-[22px] text-white font-black uppercase text-[11px] tracking-widest shadow-glow-primary"
                    >
                      Inizia Playoff
                    </button>
                  </div>
              )}
            </div>
              {/* Bottone Elimina Torneo (Anche se attivo) */}
              {!isReadOnly && (
                <div className="px-6 mt-12 mb-8">
                   <button 
                    onClick={deleteTournament}
                    className="w-full py-4 text-white/10 hover:text-red-500/30 text-[9px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2"
                   >
                     <Trash2 size={14} /> Annulla ed Elimina Torneo
                   </button>
                </div>
              )}
           </>
         )}
      </div>

      <ConfirmModal 
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmedDelete}
        title="Elimina Torneo"
        message="Questa azione eliminerà definitivamente il torneo e tutte le relative iscrizioni. Sei sicuro?"
        confirmLabel="Elimina"
      />
    </div>
  );
}

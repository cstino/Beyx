import React, { useState, useEffect } from 'react';
import { Trophy, Users, Swords, UserPlus, Trash2, CheckCircle2, Minus, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export function TournamentSetup({ onConfirm }) {
  const [name, setName] = useState('');
  const [format, setFormat] = useState('bracket'); 
  const [starterBeysCount, setStarterBeysCount] = useState(1);
  const [reserveBeysCount, setReserveBeysCount] = useState(0);
  const [battleType, setBattleType] = useState('1v1');
  const [participants, setParticipants] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  
  const [entryMode, setEntryMode] = useState('invitation'); // 'invitation' | 'open'
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [rrCycles, setRrCycles] = useState(1);
  const [rrWinnerMode, setRrWinnerMode] = useState('points'); // 'points' | 'playoff'
  const [playoffType, setPlayoffType] = useState('final'); // 'final' | 'semi' | 'play_in'
  const [pointTarget, setPointTarget] = useState(4);
  const [winCondition, setWinCondition] = useState('point_target');
  const [description, setDescription] = useState('');
  const [beybladeMode, setBeybladeMode] = useState('personali'); // 'personali' | 'pool'
  const [assignmentMode, setAssignmentMode] = useState('random'); // 'random' | 'draft' | 'asta'

  useEffect(() => {
    supabase.from('profiles').select('id, username, avatar_id, avatar_color')
      .then(({ data }) => setActiveUsers(data || []));
  }, []);

  function addParticipant(user) {
    if (participants.find(p => p.user_id === user.id)) return;
    setParticipants([...participants, { user_id: user.id, username: user.username, seed: participants.length + 1 }]);
  }

  function addGuest() {
    if (!guestName) return;
    setParticipants([...participants, { guest_name: guestName, username: guestName, seed: participants.length + 1 }]);
    setGuestName('');
  }

  function removeParticipant(index) {
    setParticipants(participants.filter((_, i) => i !== index));
  }

  const canStart = entryMode === 'open' ? (maxParticipants >= 2) : (participants.length >= 2);

  return (
    <div className="space-y-8 pb-32">
      <div className="text-white/60 text-sm font-medium italic opacity-50">Configura la tua competizione</div>
      
      {/* Name Input */}
      <div className="p-5 rounded-3xl bg-[#12122A] border border-white/5 focus-within:border-primary/20 transition-all">
        <div className="text-[10px] font-black text-primary tracking-[0.2em] mb-2 uppercase text-center">NOME TORNEO</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={entryMode === 'open' ? "Nome del Torneo Pubblico..." : "es. Torneo d'Estate 2024"}
          className="w-full bg-transparent text-white font-createfuture text-xl text-center italic outline-none placeholder-white/10"
        />
      </div>
      
      {/* Format & Custom Roster Size */}
      <div className="space-y-6">
        {/* Formato */}
        <div className="space-y-2">
           <label className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase px-1">Formato</label>
           <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5 shadow-inner">
             <button onClick={() => setFormat('bracket')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${format === 'bracket' ? 'bg-primary text-white shadow-glow-primary' : 'text-white/30'}`}>TABELLONE</button>
             <button onClick={() => setFormat('round_robin')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${format === 'round_robin' ? 'bg-[#4361EE] text-white shadow-lg shadow-[#4361EE]/20' : 'text-white/30'}`}>GIRONE</button>
           </div>
        </div>

        {/* Dimensione Roster */}
        <div className="space-y-4">
          <label className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase px-1">
            DIMENSIONE ROSTER BEYBLADE
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Starters count */}
            <div className="p-4 rounded-2xl bg-[#12122A] border border-white/10 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-1 bottom-0 bg-primary" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Swords size={14} className="text-primary" />
                  <span className="text-xs font-black text-white uppercase font-createfuture italic">Bey Titolari</span>
                </div>
                <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Round da giocare</p>
              </div>

              <div className="flex items-center justify-between gap-3 mt-4 bg-white/5 p-2 rounded-xl border border-white/5">
                <button 
                  onClick={() => {
                    const s = Math.max(1, starterBeysCount - 1);
                    setStarterBeysCount(s);
                    setBattleType(reserveBeysCount > 0 ? `${s}v${s} (+${reserveBeysCount})` : `${s}v${s}`);
                  }}
                  className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all font-bold"
                >
                  -
                </button>
                <span className="text-2xl font-black text-white font-createfuture italic tabular-nums">
                  {starterBeysCount}
                </span>
                <button 
                  onClick={() => {
                    const s = starterBeysCount + 1;
                    setStarterBeysCount(s);
                    setBattleType(reserveBeysCount > 0 ? `${s}v${s} (+${reserveBeysCount})` : `${s}v${s}`);
                  }}
                  className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 active:scale-95 transition-all font-bold border border-primary/20"
                >
                  +
                </button>
              </div>
            </div>

            {/* Reserves count */}
            <div className="p-4 rounded-2xl bg-[#12122A] border border-white/10 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-1 bottom-0 bg-[#4361EE]" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-[#4361EE]" />
                  <span className="text-xs font-black text-white uppercase font-createfuture italic">Bey di Riserva</span>
                </div>
                <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Roster esteso</p>
              </div>

              <div className="flex items-center justify-between gap-3 mt-4 bg-white/5 p-2 rounded-xl border border-white/5">
                <button 
                  onClick={() => {
                    const r = Math.max(0, reserveBeysCount - 1);
                    setReserveBeysCount(r);
                    setBattleType(r > 0 ? `${starterBeysCount}v${starterBeysCount} (+${r})` : `${starterBeysCount}v${starterBeysCount}`);
                  }}
                  className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all font-bold disabled:opacity-20"
                  disabled={!reserveBeysCount}
                >
                  -
                </button>
                <span className={`text-2xl font-black font-createfuture italic tabular-nums ${reserveBeysCount ? 'text-[#4361EE]' : 'text-white/20'}`}>
                  {reserveBeysCount}
                </span>
                <button 
                  onClick={() => {
                    const r = reserveBeysCount + 1;
                    setReserveBeysCount(r);
                    setBattleType(r > 0 ? `${starterBeysCount}v${starterBeysCount} (+${r})` : `${starterBeysCount}v${starterBeysCount}`);
                  }}
                  className="w-10 h-10 rounded-lg bg-[#4361EE]/20 text-[#4361EE] flex items-center justify-center hover:bg-[#4361EE]/30 active:scale-95 transition-all font-bold border border-[#4361EE]/20"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Win Condition Selection */}
      <div className="space-y-3">
         <label className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase px-1">Condizione di Vittoria</label>
         <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5 shadow-inner">
           <button 
             onClick={() => setWinCondition('point_target')} 
             className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${winCondition === 'point_target' ? 'bg-primary text-white shadow-glow-primary' : 'text-white/30'}`}
           >
             PUNTEGGIO
           </button>
           <button 
             onClick={() => setWinCondition('total_battle')} 
             className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${winCondition === 'total_battle' ? 'bg-[#4361EE] text-white shadow-lg shadow-[#4361EE]/20' : 'text-white/30'}`}
           >
             TOTAL BATTLE
           </button>
         </div>
      </div>

      {/* Point Target UI - Only visible if Point Target mode is selected */}
      <AnimatePresence>
        {winCondition === 'point_target' ? (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
             <label className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase px-1">Punteggio Target Incontro</label>
             <div className="flex items-center gap-4 bg-[#12122A] rounded-[28px] p-2 border border-white/5">
                <button 
                  onClick={() => setPointTarget(Math.max(1, pointTarget - 1))}
                  className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <Minus size={20} />
                </button>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-black text-white italic">{pointTarget}</div>
                  <div className="text-[8px] font-black text-primary uppercase tracking-widest">PUNTI</div>
                </div>
                <button 
                  onClick={() => setPointTarget(pointTarget + 1)}
                  className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <Plus size={20} />
                </button>
             </div>
             <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest text-center px-4">
               Il primo blader che raggiunge {pointTarget} punti vince l'incontro.
             </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="p-6 rounded-[32px] bg-[#4361EE]/5 border border-[#4361EE]/20 space-y-2 overflow-hidden"
          >
             <div className="text-[10px] font-black text-[#4361EE] tracking-widest uppercase italic text-center">Modalità Total Battle</div>
             <p className="text-[9px] text-white/40 font-medium text-center leading-relaxed">
               I blader dovranno disputare tutti i {starterBeysCount} Round previsti.<br/>
               Vince chi accumula più punti totali. In caso di parità, viene assegnato un punto ciascuno.
             </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Round Robin Customization */}
      {format === 'round_robin' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="space-y-6 p-6 bg-white/5 rounded-[32px] border border-white/5"
        >
          <div className="space-y-3">
             <label className="text-[9px] font-black text-primary tracking-[0.2em] uppercase px-1">Giri del Girone (A/R)</label>
             <div className="flex items-center gap-4 bg-[#0A0A1A] rounded-2xl p-2 border border-white/5">
                <button onClick={() => setRrCycles(Math.max(1, rrCycles - 1))} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white"><Minus size={16} /></button>
                <div className="flex-1 text-center font-black text-xl text-white italic">{rrCycles} {rrCycles === 1 ? 'Giro' : 'Giri'}</div>
                <button onClick={() => setRrCycles(rrCycles + 1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white"><Plus size={16} /></button>
             </div>
             <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest text-center">
               {rrCycles === 1 ? "Ogni blader sfida gli altri una volta." : `Ogni blader sfida gli altri ${rrCycles} volte.`}
             </p>
          </div>

          <div className="space-y-3">
             <label className="text-[9px] font-black text-primary tracking-[0.2em] uppercase px-1">Modalità Vincitore</label>
             <div className="flex bg-[#0A0A1A] rounded-2xl p-1 border border-white/5">
               <button onClick={() => setRrWinnerMode('points')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${rrWinnerMode === 'points' ? 'bg-[#4361EE] text-white' : 'text-white/30'}`}>PUNTI</button>
               <button onClick={() => setRrWinnerMode('playoff')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${rrWinnerMode === 'playoff' ? 'bg-[#4361EE] text-white' : 'text-white/30'}`}>PLAYOFF</button>
             </div>
          </div>

          {rrWinnerMode === 'playoff' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
               <label className="text-[9px] font-black text-[#4361EE] tracking-[0.2em] uppercase px-1">Tipo di Playoff</label>
               <div className="grid grid-cols-1 gap-2">
                 {[
                   { id: 'final', label: 'FINALE (TOP 2)', desc: 'Il primo e il secondo si sfidano in finale.' },
                   { id: 'semi', label: 'SEMIFINALI (TOP 4)', desc: '1° vs 4° e 2° vs 3°. I vincenti vanno in finale.' },
                   { id: 'play_in', label: 'PLAY-IN (TOP 6)', desc: '1° e 2° aspettano. 3°vs6° e 4°vs5° per le semi.' }
                 ].map(t => (
                   <button 
                    key={t.id} 
                    onClick={() => setPlayoffType(t.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${playoffType === t.id ? 'bg-[#4361EE]/10 border-[#4361EE]/40' : 'bg-[#0A0A1A] border-white/5'}`}
                   >
                     <div className={`text-[10px] font-black uppercase italic ${playoffType === t.id ? 'text-[#4361EE]' : 'text-white/40'}`}>{t.label}</div>
                     <div className="text-[8px] font-bold text-white/20 uppercase mt-0.5">{t.desc}</div>
                   </button>
                 ))}
               </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Beyblade Mode Selection */}
      <div className="space-y-4">
        <label className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase px-1">Beyblade</label>
        <div className="bg-[#12122A] p-2 rounded-[28px] border border-white/5 flex gap-2">
          <button 
            onClick={() => setBeybladeMode('personali')}
            className={`flex-1 py-4 px-4 rounded-[22px] flex flex-col items-center justify-center gap-1 transition-all ${beybladeMode === 'personali' ? 'bg-[#4361EE]/10 text-[#4361EE] border border-[#4361EE]/20 shadow-[0_0_15px_rgba(67,97,238,0.1)]' : 'text-white/20 hover:text-white/40'}`}
          >
            <Users size={16} /> 
            <span className="text-[10px] font-black uppercase tracking-widest">Personali</span>
          </button>
          <button 
            onClick={() => setBeybladeMode('pool')}
            className={`flex-1 py-4 px-4 rounded-[22px] flex flex-col items-center justify-center gap-1 transition-all ${beybladeMode === 'pool' ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(233,69,96,0.1)]' : 'text-white/20 hover:text-white/40'}`}
          >
            <Trophy size={16} /> 
            <span className="text-[10px] font-black uppercase tracking-widest">Pool</span>
          </button>
        </div>
        
        <AnimatePresence>
          {beybladeMode === 'pool' ? (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="p-5 rounded-[32px] bg-primary/5 border border-primary/10 space-y-4">
                <label className="text-[8px] font-black text-primary tracking-[0.2em] uppercase block text-center">Metodo di Assegnazione Pool</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'random', label: 'Random', desc: 'Assegnazione Casuale' },
                    { id: 'draft', label: 'Draft', desc: 'Draft a Serpentina' },
                    { id: 'asta', label: 'Asta', desc: 'Asta a Crediti' }
                  ].map(m => (
                    <button 
                      key={m.id}
                      onClick={() => setAssignmentMode(m.id)}
                      className={`py-3 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all ${assignmentMode === m.id ? 'bg-primary/20 border-primary/40' : 'bg-[#0A0A1A] border-white/5'}`}
                    >
                      <span className={`text-[9px] font-black uppercase tracking-tighter ${assignmentMode === m.id ? 'text-primary' : 'text-white/40'}`}>{m.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="bg-black/20 p-3 rounded-2xl">
                  <p className="text-[8px] text-white/40 font-medium leading-relaxed text-center uppercase tracking-wider">
                    {assignmentMode === 'random' && "I Beyblade verranno assegnati ai partecipanti in modo completamente casuale."}
                    {assignmentMode === 'draft' && "I partecipanti sceglieranno i Beyblade seguendo un ordine a serpentina."}
                    {assignmentMode === 'asta' && "100 crediti a testa. Max 98 per Bey. Devi poterne acquistare 3!"}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-[9px] text-white/20 font-bold uppercase tracking-widest text-center px-4"
            >
              Ogni partecipante utilizzerà i propri Beyblade salvati nel profilo.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Entry Mode Toggle */}
      <div className="space-y-3">
         <label className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase px-1">Modalità Iscrizione</label>
         <div className="bg-[#12122A] p-2 rounded-[28px] border border-white/5 flex gap-2">
            <button 
              onClick={() => setEntryMode('invitation')}
              className={`flex-1 py-4 px-4 rounded-[22px] flex items-center justify-center gap-3 transition-all ${entryMode === 'invitation' ? 'bg-[#4361EE]/10 text-[#4361EE] border border-[#4361EE]/20' : 'text-white/20 hover:text-white/40'}`}
            >
              <Users size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Ad Invito</span>
            </button>
            <button 
              onClick={() => setEntryMode('open')}
              className={`flex-1 py-4 px-4 rounded-[22px] flex items-center justify-center gap-3 transition-all ${entryMode === 'open' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-white/20 hover:text-white/40'}`}
            >
              <Swords size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Aperte</span>
            </button>
         </div>
         <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest text-center px-4">
           {entryMode === 'invitation' 
             ? "Solo i Blader selezionati potranno confermare e inserire il loro deck."
             : "Chiunque potrà iscriversi e partecipare al torneo."}
         </p>
      </div>

      <AnimatePresence mode="wait">
        {entryMode === 'invitation' ? (
          <motion.div 
            key="invitation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-white tracking-[0.2em] uppercase pl-1">Invitati ({participants.length})</h3>
              {participants.length < 2 && <div className="text-[9px] font-bold text-white/20 italic animate-pulse">Invita almeno 2 Blader</div>}
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar pr-2">
              {participants.map((p, i) => (
                <div key={p.user_id || p.guest_name} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-[10px] text-white/40">{i+1}</div>
                    <span className="text-sm font-black text-white uppercase italic tracking-tight">{p.username}</span>
                  </div>
                  <button onClick={() => removeParticipant(i)} className="p-2 text-white/10 hover:text-primary"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className="pt-2 space-y-4">
              <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/5 focus-within:border-white/20 shadow-inner">
                    <UserPlus size={18} className="text-white/20" />
                    <input type="text" placeholder="Nome Ospite..." value={guestName} onChange={(e) => setGuestName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addGuest()} className="bg-transparent outline-none text-white text-sm font-bold flex-1" />
                  </div>
                  <button onClick={addGuest} className="w-14 h-14 rounded-2xl bg-[#4361EE] flex items-center justify-center text-white active:scale-95 shadow-lg shadow-[#4361EE]/20"><CheckCircle2 size={24} /></button>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear-right">
                {activeUsers.map(u => (
                  <button key={u.id} onClick={() => addParticipant(u)} className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-widest hover:border-[#4361EE]/50 hover:bg-[#4361EE]/5 transition-all">
                    {u.username}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="open" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 rounded-3xl bg-[#12122A] border border-white/5">
                 <div className="text-[9px] font-black text-white/30 tracking-widest uppercase mb-2">Max Blader</div>
                 <input 
                   type="number" value={maxParticipants} 
                   onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 2)} 
                   className="bg-transparent text-white font-black text-2xl outline-none"
                 />
               </div>
               <div className="p-5 rounded-3xl bg-[#12122A] border border-white/5 flex flex-col justify-center">
                 <div className="text-[9px] font-black text-white/30 tracking-widest uppercase mb-1">Visibilità</div>
                 <div className="text-sm font-black text-primary uppercase italic">Public Arena</div>
               </div>
            </div>
            <div className="p-5 rounded-3xl bg-[#12122A] border border-white/5">
               <div className="text-[9px] font-black text-white/30 tracking-widest uppercase mb-2">Descrizione Torneo</div>
               <textarea 
                 value={description} onChange={(e) => setDescription(e.target.value)}
                 placeholder="Regole, premi, location..."
                 className="w-full bg-transparent text-white text-sm font-bold min-h-[80px] outline-none placeholder-white/5"
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => onConfirm({ 
          name, format, battleType, starterBeysCount, reserveBeysCount, participants, pointTarget, winCondition,
          registrationOpen: true, // Always true now, but filtered by mode
          registrationMode: entryMode, 
          maxParticipants: entryMode === 'invitation' ? participants.length : maxParticipants,
          description,
          rrCycles: format === 'round_robin' ? rrCycles : 1,
          rrWinnerMode: format === 'round_robin' ? rrWinnerMode : 'points',
          playoffType: (format === 'round_robin' && rrWinnerMode === 'playoff') ? playoffType : null,
          beybladeMode,
          assignmentMode: beybladeMode === 'pool' ? assignmentMode : null
        })}
        disabled={!canStart}
        whileTap={{ scale: 0.96 }}
        className="w-full py-5 rounded-[22px] font-black text-[11px] tracking-[0.3em] text-white disabled:opacity-20 shadow-glow-primary flex items-center justify-center gap-3 uppercase transition-all overflow-hidden relative"
        style={{ 
           background: canStart ? 'linear-gradient(135deg, #E94560, #C9304A)' : 'rgba(255,255,255,0.05)',
           boxShadow: canStart ? '0 10px 40px -10px rgba(233,69,96,0.5)' : 'none'
        }}
      >
        <div className="relative z-10 flex items-center gap-3">
           {entryMode === 'open' ? 'APRI ISCRIZIONI' : 'CREA E INVITA'} <Trophy size={18} strokeWidth={3} />
        </div>
      </motion.button>
    </div>
  );
}

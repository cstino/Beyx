import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Swords, Users } from 'lucide-react';
import { PlayerPicker } from '../../components/battle/PlayerPicker';
import { DeckPicker } from '../../components/battle/DeckPicker';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { OfficialToggle } from '../../components/battle/OfficialToggle';

const STEPS = ['players', 'settings', 'decks'];

function estimateElo(playerElo, opponentElo) {
  const expected = 1.0 / (1.0 + Math.pow(10, (opponentElo - playerElo) / 400));
  const k = 24; 
  const win = Math.round(k * (1 - expected));
  const loss = Math.round(k * (0 - expected));
  return { win, loss };
}

export function NewMatchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useAuthStore(s => s.user?.id);
  const setHeader = useUIStore(s => s.setHeader);
  const clearHeader = useUIStore(s => s.clearHeader);
  const [step, setStep] = useState(0);

  const initialFormat = (location.state?.format === 'quick' ? '1v1' : location.state?.format) || '1v1';
  const initialStarters = initialFormat === '3v3' ? 3 : 1;

  const [match, setMatch] = useState({
    format: initialFormat,
    starter_beys_count: initialStarters,
    reserve_beys_count: 0,
    player1: { user_id: userId, guest_name: null },
    player2: { user_id: null, guest_name: null },
    point_target: 4,
    win_condition: 'point_target',
    is_official: false,
    p1_deck_id: null,
    p2_deck_id: null,
  });

  const STEP_TITLES = ['NUOVA SFIDA', 'IMPOSTAZIONI', 'SCEGLI DECK'];

  useEffect(() => {
    if (userId) {
      supabase.from('profiles').select('elo').eq('id', userId).single().then(({ data }) => {
        if (data) {
          setMatch(m => ({ ...m, player1: { ...m.player1, elo: data.elo } }));
        }
      });
    }
  }, [userId]);

  useEffect(() => {
    const backPath = step > 0 ? null : '/battle';
    const backAction = step > 0 ? () => setStep(s => s - 1) : null;
    
    setHeader(STEP_TITLES[step], backPath, backAction);
    
    return () => clearHeader();
  }, [step]);

  async function handleCreate() {
    const isInvitation = !!match.player2.user_id;

    const { data, error } = await supabase.from('battles').insert({
      format:             match.format,
      starter_beys_count: match.starter_beys_count,
      reserve_beys_count: match.reserve_beys_count,
      win_condition:      match.win_condition,
      player1_user_id:    match.player1.user_id,
      player1_guest_name: match.player1.guest_name,
      player2_user_id:    match.player2.user_id,
      player2_guest_name: match.player2.guest_name,
      point_target:       match.point_target,
      is_official:        match.is_official,
      p1_deck_id:         match.p1_deck_id,
      p2_deck_id:         match.p2_deck_id,
      p1_deck_config:     match.p1_deck_config,
      status:             isInvitation ? 'pending' : 'active',
      created_by:         userId,
      admin_user_id:      userId,
    }).select().single();

    if (!error) {
      if (isInvitation) {
        navigate('/battle', { state: { invitationSent: true } });
      } else {
        navigate(`/battle/live/${data.id}`);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-24 px-4 pt-4">
      {/* Status Info */}
      <div className="mb-4 px-2">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#E94560] mb-1 font-createfuture">
            STEP {step + 1} / {STEPS.length}
          </div>
          <div className="text-white font-black text-lg uppercase italic font-createfuture">
            {['Giocatori', 'Configurazione', 'Selezione Deck'][step]}
          </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #4361EE, #E94560)' }}
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step 0: Player Picker */}
      {step === 0 && (
        <PlayerPicker
          battle={match}
          onChange={setMatch}
          onNext={() => setStep(1)}
        />
      )}

      {/* Step 1: Match Settings */}
      {step === 1 && (
        <MatchSettings
          match={match}
          onChange={setMatch}
          onNext={() => setStep(2)}
        />
      )}

      {/* Step 2: Deck Selection */}
      {step === 2 && (
        <DeckPicker
          match={match}
          onChange={setMatch}
          onStart={handleCreate}
        />
      )}
    </div>
  );
}

function MatchSettings({ match, onChange, onNext }) {
  const canBeOfficial = match.player1.user_id && match.player2.user_id;

  return (
    <div>
      {/* Roster Size Custom Selector */}
      <div className="mb-6 space-y-4">
        <div className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase font-createfuture">
          DIMENSIONE ROSTER BEYBLADE
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Starters count */}
          <div className="p-4 rounded-2xl bg-[#12122A] border border-white/10 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1 bottom-0 bg-primary" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Swords size={14} className="text-primary" />
                <span className="text-xs font-black text-white uppercase font-createfuture italic">Bey Titolari</span>
              </div>
              <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Giocati nel match</p>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4 bg-white/5 p-2 rounded-xl border border-white/5">
              <button 
                onClick={() => {
                  const s = Math.max(1, (match.starter_beys_count || 1) - 1);
                  const fmt = match.reserve_beys_count > 0 ? `${s}v${s} (+${match.reserve_beys_count})` : `${s}v${s}`;
                  onChange({ ...match, starter_beys_count: s, format: fmt });
                }}
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all font-bold"
              >
                -
              </button>
              <span className="text-2xl font-black text-white font-createfuture italic tabular-nums">
                {match.starter_beys_count || 1}
              </span>
              <button 
                onClick={() => {
                  const s = (match.starter_beys_count || 1) + 1;
                  const fmt = match.reserve_beys_count > 0 ? `${s}v${s} (+${match.reserve_beys_count})` : `${s}v${s}`;
                  onChange({ ...match, starter_beys_count: s, format: fmt });
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
              <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Scelta estesa a sorpresa</p>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4 bg-white/5 p-2 rounded-xl border border-white/5">
              <button 
                onClick={() => {
                  const r = Math.max(0, (match.reserve_beys_count || 0) - 1);
                  const fmt = r > 0 ? `${match.starter_beys_count}v${match.starter_beys_count} (+${r})` : `${match.starter_beys_count}v${match.starter_beys_count}`;
                  onChange({ ...match, reserve_beys_count: r, format: fmt });
                }}
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all font-bold disabled:opacity-20"
                disabled={!match.reserve_beys_count}
              >
                -
              </button>
              <span className={`text-2xl font-black font-createfuture italic tabular-nums ${match.reserve_beys_count ? 'text-[#4361EE]' : 'text-white/20'}`}>
                {match.reserve_beys_count || 0}
              </span>
              <button 
                onClick={() => {
                  const r = (match.reserve_beys_count || 0) + 1;
                  const fmt = r > 0 ? `${match.starter_beys_count}v${match.starter_beys_count} (+${r})` : `${match.starter_beys_count}v${match.starter_beys_count}`;
                  onChange({ ...match, reserve_beys_count: r, format: fmt });
                }}
                className="w-10 h-10 rounded-lg bg-[#4361EE]/20 text-[#4361EE] flex items-center justify-center hover:bg-[#4361EE]/30 active:scale-95 transition-all font-bold border border-[#4361EE]/20"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Total Roster Summary feedback box */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between px-4">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Roster Totale Richiesto</span>
          <span className="text-xs font-black text-white font-createfuture italic">
            {(match.starter_beys_count || 1) + (match.reserve_beys_count || 0)} BEYBLADE
          </span>
        </div>
      </div>

      {/* Win condition selector */}
      <div className="mb-6">
        <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3 font-createfuture uppercase">
          MODALITÀ DI VITTORIA
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => onChange({ ...match, win_condition: 'point_target' })}
            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
              match.win_condition !== 'total_battle' ? 'bg-primary/10 border-primary text-white shadow-glow-primary-sm' : 'bg-[#12122A] border-white/5 text-white/40'
            }`}
          >
            <div className="text-xs font-black uppercase font-createfuture">Punti Target</div>
            <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Primo a X punti</div>
          </button>
          
          <button
            onClick={() => onChange({ ...match, win_condition: 'total_battle' })}
            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
              match.win_condition === 'total_battle' ? 'bg-[#F5A623]/10 border-[#F5A623] text-white shadow-glow-accent-sm' : 'bg-[#12122A] border-white/5 text-white/40'
            }`}
          >
            <div className="text-xs font-black uppercase font-createfuture text-[#F5A623]">Total Battle</div>
            <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
              Fine al Round {match.starter_beys_count || 1}
            </div>
          </button>
        </div>

        {/* If point target mode, show the point selectors */}
        {match.win_condition !== 'total_battle' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2">
            {[4, 7].map(pt => (
              <button
                key={pt}
                onClick={() => onChange({ ...match, point_target: pt })}
                className={`flex-1 py-3 rounded-xl border font-bold text-center transition-colors
                  ${match.point_target === pt
                    ? 'bg-[#E94560]/10 border-[#E94560]/50 text-[#E94560]'
                    : 'bg-[#12122A] border-white/10 text-white/50'}`}
              >
                {pt} PT
              </button>
            ))}
            {/* Custom input */}
            <div className={`flex-1 rounded-xl border flex items-center justify-center
              ${![4, 7].includes(match.point_target)
                ? 'bg-[#E94560]/10 border-[#E94560]/50'
                : 'bg-[#12122A] border-white/10'}`}>
              <input
                type="number"
                min={1}
                max={99}
                value={![4, 7].includes(match.point_target) ? match.point_target : ''}
                placeholder="Custom"
                onChange={e => {
                  const v = parseInt(e.target.value);
                  if (v > 0 && v <= 99) onChange({ ...match, point_target: v });
                }}
                className="w-full text-center bg-transparent text-white font-bold text-sm
                  outline-none placeholder-white/30 py-3"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Official toggle */}
      <div className="mb-8">
        <OfficialToggle
          isOfficial={match.is_official}
          canBeOfficial={canBeOfficial}
          reason={!canBeOfficial ? 'Solo tra utenti registrati' : ''}
          onChange={val => onChange({ ...match, is_official: val })}
        />

        {match.is_official && canBeOfficial && match.player1.elo && match.player2.elo && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Stima Variazione</div>
              <div className="text-[10px] font-bold text-white/60">Basata su differenza ELO</div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                 <div className="text-[8px] font-bold text-white/30 uppercase mb-1">Vittoria</div>
                 <div className="text-sm font-black text-primary italic">+{estimateElo(match.player1.elo, match.player2.elo).win}</div>
              </div>
              <div className="text-center">
                 <div className="text-[8px] font-bold text-white/30 uppercase mb-1">Sconfitta</div>
                 <div className="text-sm font-black text-[#E94560] italic">{estimateElo(match.player1.elo, match.player2.elo).loss}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 rounded-xl font-bold tracking-wider text-white"
        style={{ background: 'linear-gradient(135deg, #4361EE, #2E45C9)' }}
      >
        CONTINUA
      </button>
    </div>
  );
}

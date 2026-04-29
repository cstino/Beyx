import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PlayerPicker } from '../../components/battle/PlayerPicker';
import { DeckPicker } from '../../components/battle/DeckPicker';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { OfficialToggle } from '../../components/battle/OfficialToggle';

const STEPS = ['players', 'settings', 'decks'];

export function NewMatchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useAuthStore(s => s.user?.id);
  const setHeader = useUIStore(s => s.setHeader);
  const clearHeader = useUIStore(s => s.clearHeader);
  const [step, setStep] = useState(0);

  const [match, setMatch] = useState({
    format: location.state?.format || '1v1',       // '1v1' | '3v3'
    player1: { user_id: userId, guest_name: null },
    player2: { user_id: null, guest_name: null },
    point_target: 4,
    is_official: false,
    p1_deck_id: null,
    p2_deck_id: null,
  });

  const STEP_TITLES = ['NUOVA SFIDA', 'IMPOSTAZIONI', 'SCEGLI DECK'];

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
        // Se è un invito, torniamo alla pagina Battle mostrando un feedback
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
      {/* Format selector */}
      <div className="mb-6">
        <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3 font-createfuture">
          FORMATO
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: '1v1', label: '1v1', desc: 'Singolo' },
            { key: '3v3', label: '3v3', desc: 'Deck format' },
          ].map(fmt => (
            <button
              key={fmt.key}
              onClick={() => onChange({ ...match, format: fmt.key })}
              className={`p-4 rounded-xl border transition-colors text-left
                ${match.format === fmt.key
                  ? 'bg-[#4361EE]/10 border-[#4361EE]/50'
                  : 'bg-[#12122A] border-white/10'}`}
            >
              <div className="text-white font-black text-lg">{fmt.label}</div>
              <div className="text-white/50 text-xs">{fmt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Point target */}
      <div className="mb-6">
        <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3 font-createfuture">
          PUNTI PER VINCERE
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Official toggle */}
      <div className="mb-8">
        <OfficialToggle
          isOfficial={match.is_official}
          canBeOfficial={canBeOfficial}
          reason={!canBeOfficial ? 'Solo tra utenti registrati' : ''}
          onChange={val => onChange({ ...match, is_official: val })}
        />
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

# BeyManager X — Battle System V2: Round Tracking, Deck Management & Leaderboard

**Briefing for Antigravity — April 2026**

---

Hey Antigravity — questo è un refactor importante del sistema Battle. Passiamo da "segna il risultato finale" a un **tracking round-by-round** dove ogni singolo round registra: chi ha usato quale combo, che tipo di finish, quanti punti. Questo ci dà dati granulari per costruire leaderboard statistiche avanzate.

**Decisioni chiave:**
- Entrambi i giocatori possono segnare i finish (con conferma dell'altro)
- Punteggio target: 4, 7, o custom — scelto alla creazione del match
- Ogni round traccia quale combo del deck è stata usata da entrambi
- Tornei: iscrizioni aperte (con deck) o manuali (admin inserisce persone)
- Leaderboard con filtri settimana/mese e statistiche per combo e utente

---

## 1. Schema Database — Nuove Tabelle

### Rounds Table (cuore del nuovo sistema)

Ogni round è un singolo lancio/scontro all'interno di un match. Un match 4-3 ha 7 round.

```sql
-- ────────────────────────────────────────────────────
-- ROUNDS — ogni singolo lancio/scontro dentro un match
-- ────────────────────────────────────────────────────
CREATE TABLE rounds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id       UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  round_number    INT NOT NULL,

  -- Combo usata da ciascun giocatore in questo round
  p1_combo_id     UUID REFERENCES combos(id) ON DELETE SET NULL,
  p2_combo_id     UUID REFERENCES combos(id) ON DELETE SET NULL,

  -- Per ospiti senza combo salvate: testo libero descrittivo
  p1_combo_label  TEXT,   -- es. "WizardRod 5-70 Hexa" (fallback se no combo_id)
  p2_combo_label  TEXT,

  -- Risultato del round
  winner_side     TEXT CHECK (winner_side IN ('p1', 'p2', 'draw')),
  finish_type     TEXT CHECK (finish_type IN ('burst', 'ko', 'xtreme', 'spin_finish', 'draw')),
  points_awarded  INT NOT NULL DEFAULT 0,

  -- Conferma (entrambi i giocatori devono confermare)
  confirmed_by_p1 BOOLEAN DEFAULT false,
  confirmed_by_p2 BOOLEAN DEFAULT false,

  -- Timestamp
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (battle_id, round_number)
);

CREATE INDEX idx_rounds_battle   ON rounds(battle_id);
CREATE INDEX idx_rounds_combo_p1 ON rounds(p1_combo_id);
CREATE INDEX idx_rounds_combo_p2 ON rounds(p2_combo_id);
CREATE INDEX idx_rounds_finish   ON rounds(finish_type);
CREATE INDEX idx_rounds_winner   ON rounds(winner_side);
```

### Aggiornamenti alla tabella Battles

```sql
-- Aggiungi campi per il nuovo sistema
ALTER TABLE battles ADD COLUMN IF NOT EXISTS point_target INT NOT NULL DEFAULT 4;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'setup'
  CHECK (status IN ('setup', 'deck_select', 'active', 'completed', 'cancelled'));

-- Deck usati nel match (per 3v3 e tornei)
ALTER TABLE battles ADD COLUMN IF NOT EXISTS p1_deck_id UUID REFERENCES decks(id) ON DELETE SET NULL;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS p2_deck_id UUID REFERENCES decks(id) ON DELETE SET NULL;

-- Tracking di chi ha creato e chi è admin del match
ALTER TABLE battles ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
```

### Aggiornamenti alla tabella Tournaments

```sql
-- Modalità iscrizione
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_mode TEXT NOT NULL DEFAULT 'manual'
  CHECK (registration_mode IN ('open', 'manual'));

-- Punto target per match del torneo
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS point_target INT NOT NULL DEFAULT 4;

-- Registrazioni aperte: chi può iscriversi
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_open BOOLEAN NOT NULL DEFAULT false;

-- ────────────────────────────────────────────────────
-- TOURNAMENT REGISTRATIONS — iscrizioni con deck
-- ────────────────────────────────────────────────────
CREATE TABLE tournament_registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deck_id         UUID REFERENCES decks(id) ON DELETE SET NULL,
  registered_at   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (tournament_id, user_id)
);

CREATE INDEX idx_tourney_reg_tournament ON tournament_registrations(tournament_id);
CREATE INDEX idx_tourney_reg_user       ON tournament_registrations(user_id);
```

### Finish Points Mapping

```sql
-- Tabella di riferimento per punti per tipo di finish (read-only)
CREATE TABLE finish_types (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  points INT NOT NULL,
  color  TEXT NOT NULL,
  icon   TEXT NOT NULL
);

INSERT INTO finish_types VALUES
  ('burst',       'Burst Finish',   2, '#E94560', 'Zap'),
  ('ko',          'KO Finish',      2, '#4361EE', 'Target'),
  ('xtreme',      'Xtreme Finish',  3, '#F5A623', 'Flame'),
  ('spin_finish', 'Spin Finish',    1, '#00D68F', 'RotateCcw'),
  ('draw',        'Draw',           0, '#6B7280', 'Minus');

ALTER TABLE finish_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY finish_types_select ON finish_types FOR SELECT USING (true);
```

### RLS Policies

```sql
ALTER TABLE rounds                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Tutti possono leggere i round (per leaderboard, statistiche)
CREATE POLICY rounds_select ON rounds FOR SELECT USING (true);
-- Solo partecipanti e admin possono inserire/aggiornare round
CREATE POLICY rounds_insert ON rounds FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM battles b
    WHERE b.id = battle_id
    AND (b.player1_user_id = auth.uid()
      OR b.player2_user_id = auth.uid()
      OR b.admin_user_id = auth.uid()
      OR b.created_by = auth.uid())
  ));
CREATE POLICY rounds_update ON rounds FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM battles b
    WHERE b.id = battle_id
    AND (b.player1_user_id = auth.uid()
      OR b.player2_user_id = auth.uid()
      OR b.admin_user_id = auth.uid())
  ));

-- Registrazioni tornei
CREATE POLICY tourney_reg_select ON tournament_registrations FOR SELECT USING (true);
CREATE POLICY tourney_reg_insert ON tournament_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY tourney_reg_delete ON tournament_registrations FOR DELETE
  USING (auth.uid() = user_id);
```

### Trigger: auto-complete match quando si raggiunge il target

```sql
CREATE OR REPLACE FUNCTION check_match_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_battle  RECORD;
  v_p1_pts  INT;
  v_p2_pts  INT;
BEGIN
  -- Fetch the parent battle
  SELECT * INTO v_battle FROM battles WHERE id = NEW.battle_id;

  -- Sum points per side
  SELECT
    COALESCE(SUM(CASE WHEN winner_side = 'p1' THEN points_awarded ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN winner_side = 'p2' THEN points_awarded ELSE 0 END), 0)
  INTO v_p1_pts, v_p2_pts
  FROM rounds WHERE battle_id = NEW.battle_id;

  -- Update running totals on the battle
  UPDATE battles SET
    points_p1 = v_p1_pts,
    points_p2 = v_p2_pts
  WHERE id = NEW.battle_id;

  -- Check if someone reached the target
  IF v_p1_pts >= v_battle.point_target THEN
    UPDATE battles SET
      status = 'completed',
      winner_side = 'p1'
    WHERE id = NEW.battle_id;
  ELSIF v_p2_pts >= v_battle.point_target THEN
    UPDATE battles SET
      status = 'completed',
      winner_side = 'p2'
    WHERE id = NEW.battle_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_completion ON rounds;
CREATE TRIGGER trg_check_completion
  AFTER INSERT ON rounds
  FOR EACH ROW EXECUTE FUNCTION check_match_completion();
```

---

## 2. Match Flow UI

### Match Lifecycle

```
setup → deck_select → active → completed
  │                     │
  │   (admin cancels)   │   (target reached)
  └─► cancelled         └─► completed (auto via trigger)
```

### New Match Creation: `NewMatchPage.jsx`

```jsx
// pages/battle/NewMatchPage.jsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Trophy, Settings } from 'lucide-react';
import { PlayerPicker } from '../../components/battle/PlayerPicker';
import { DeckPicker } from '../../components/battle/DeckPicker';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';
import { OfficialToggle } from '../../components/battle/OfficialToggle';

const STEPS = ['players', 'settings', 'decks'];

export function NewMatchPage() {
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);
  const [step, setStep] = useState(0);

  const [match, setMatch] = useState({
    format: '1v1',       // '1v1' | '3v3'
    player1: { user_id: userId, guest_name: null },
    player2: { user_id: null, guest_name: null },
    point_target: 4,
    is_official: false,
    p1_deck_id: null,
    p2_deck_id: null,
  });

  async function handleCreate() {
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
      status:             'active',
      created_by:         userId,
      admin_user_id:      userId,
    }).select().single();

    if (!error) navigate(`/battle/live/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-24 px-4 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
          className="p-2 rounded-xl bg-white/5 text-white/70">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#E94560]">
            STEP {step + 1} / {STEPS.length}
          </div>
          <div className="text-white font-black text-lg">
            {['Giocatori', 'Impostazioni', 'Deck'][step]}
          </div>
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

      {/* Step 0: Player Picker (existing) */}
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
        <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3">
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
        <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3">
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
```

### Deck Picker Component

```jsx
// components/battle/DeckPicker.jsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';

export function DeckPicker({ match, onChange, onStart }) {
  const userId = useAuthStore(s => s.user?.id);
  const [myDecks, setMyDecks] = useState([]);
  const [oppDecks, setOppDecks] = useState([]);
  const [activeSide, setActiveSide] = useState('p1');
  const [showCreateCombo, setShowCreateCombo] = useState(false);

  useEffect(() => {
    // Fetch my saved decks (combos grouped as decks)
    supabase.from('decks')
      .select(`*, combo1:combo1_id(id, name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                   combo2:combo2_id(id, name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                   combo3:combo3_id(id, name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name))`)
      .eq('user_id', userId)
      .then(({ data }) => setMyDecks(data ?? []));

    // Fetch opponent's decks if registered user
    if (match.player2.user_id) {
      supabase.from('decks')
        .select(`*, combo1:combo1_id(id, name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                     combo2:combo2_id(id, name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                     combo3:combo3_id(id, name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name))`)
        .eq('user_id', match.player2.user_id)
        .then(({ data }) => setOppDecks(data ?? []));
    }
  }, [userId, match.player2.user_id]);

  const decks = activeSide === 'p1' ? myDecks : oppDecks;
  const selectedId = activeSide === 'p1' ? match.p1_deck_id : match.p2_deck_id;

  function selectDeck(deckId) {
    const key = activeSide === 'p1' ? 'p1_deck_id' : 'p2_deck_id';
    onChange({ ...match, [key]: deckId });
  }

  // For 1v1, show single combo selection instead of full deck
  const is1v1 = match.format === '1v1';

  return (
    <div>
      <div className="text-white/60 text-sm mb-4">
        {is1v1
          ? 'Seleziona la combo per ogni giocatore (opzionale)'
          : 'Seleziona il deck per ogni giocatore'}
      </div>

      {/* Side toggle */}
      <div className="flex gap-2 mb-4 p-1 bg-[#12122A] rounded-xl">
        <button
          onClick={() => setActiveSide('p1')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors
            ${activeSide === 'p1' ? 'bg-[#E94560] text-white' : 'text-white/50'}`}
        >
          TU
        </button>
        <button
          onClick={() => setActiveSide('p2')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors
            ${activeSide === 'p2' ? 'bg-[#4361EE] text-white' : 'text-white/50'}`}
        >
          AVVERSARIO
        </button>
      </div>

      {/* Deck list */}
      <div className="space-y-2 mb-4">
        {decks.map(deck => {
          const selected = selectedId === deck.id;
          return (
            <button
              key={deck.id}
              onClick={() => selectDeck(deck.id)}
              className={`w-full p-3 rounded-xl border text-left transition-colors
                ${selected
                  ? 'bg-white/5 border-[#E94560]/50'
                  : 'bg-[#12122A] border-white/5 hover:border-white/15'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-bold text-sm">{deck.name}</div>
                {selected && <Check size={16} className="text-[#E94560]" />}
              </div>
              <div className="flex gap-2">
                {[deck.combo1, deck.combo2, deck.combo3].map((c, i) => c && (
                  <div key={i} className="flex-1 bg-[#0A0A1A] rounded-lg px-2 py-1.5">
                    <div className="text-[8px] text-white/40 font-bold tracking-wider">
                      COMBO {i + 1}
                    </div>
                    <div className="text-white text-[10px] font-bold truncate">
                      {[c.blade?.name, c.ratchet?.name, c.bit?.name].filter(Boolean).join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Create new / skip */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => setShowCreateCombo(true)}
          className="py-3 rounded-xl bg-white/5 border border-white/10 text-white/70
            text-xs font-bold flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          CREA NUOVA
        </button>
        <button
          onClick={() => {
            if (activeSide === 'p1') setActiveSide('p2');
            // else continue to start
          }}
          className="py-3 rounded-xl bg-white/5 border border-white/10 text-white/50
            text-xs font-bold"
        >
          SKIP
        </button>
      </div>

      {/* Start match button */}
      <motion.button
        onClick={onStart}
        whileTap={{ scale: 0.97 }}
        className="w-full py-4 rounded-xl font-bold tracking-wider text-white
          flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #E94560, #C9304A)',
          boxShadow: '0 4px 20px -4px rgba(233,69,96,0.5)',
        }}
      >
        INIZIA MATCH
      </motion.button>
    </div>
  );
}
```

---

## 3. Live Match Page: Round-by-Round Tracking

Questa è la pagina centrale — dove si gioca, si seleziona la combo per il round, e si segna il finish.

```jsx
// pages/battle/LiveMatchPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, Target, Flame, RotateCcw, Minus, Trophy, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';
import { PageContainer } from '../../components/PageContainer';

const FINISH_TYPES = [
  { id: 'burst',       name: 'Burst',   points: 2, icon: Zap,       color: '#E94560' },
  { id: 'ko',          name: 'KO',      points: 2, icon: Target,    color: '#4361EE' },
  { id: 'xtreme',      name: 'Xtreme',  points: 3, icon: Flame,     color: '#F5A623' },
  { id: 'spin_finish', name: 'Spin',    points: 1, icon: RotateCcw, color: '#00D68F' },
  { id: 'draw',        name: 'Draw',    points: 0, icon: Minus,     color: '#6B7280' },
];

export function LiveMatchPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);

  const [battle, setBattle] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [p1Combos, setP1Combos] = useState([]);
  const [p2Combos, setP2Combos] = useState([]);

  // Current round state
  const [selectedP1Combo, setSelectedP1Combo] = useState(null);
  const [selectedP2Combo, setSelectedP2Combo] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [selectedFinish, setSelectedFinish] = useState(null);
  const [pendingConfirm, setPendingConfirm] = useState(null);

  // Load battle + rounds + combos
  useEffect(() => {
    loadBattle();

    // Realtime subscription for round updates (for two-player confirmation)
    const channel = supabase
      .channel(`battle-${battleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rounds',
        filter: `battle_id=eq.${battleId}`,
      }, () => loadRounds())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'battles',
        filter: `id=eq.${battleId}`,
      }, () => loadBattle())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [battleId]);

  async function loadBattle() {
    const { data } = await supabase.from('battles')
      .select(`*,
        p1_deck:p1_deck_id(*, combo1:combo1_id(*, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                               combo2:combo2_id(*, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                               combo3:combo3_id(*, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name))),
        p2_deck:p2_deck_id(*, combo1:combo1_id(*, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                               combo2:combo2_id(*, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                               combo3:combo3_id(*, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)))
      `)
      .eq('id', battleId)
      .single();

    setBattle(data);

    // Extract combo options from decks
    if (data?.p1_deck) {
      setP1Combos([data.p1_deck.combo1, data.p1_deck.combo2, data.p1_deck.combo3].filter(Boolean));
    }
    if (data?.p2_deck) {
      setP2Combos([data.p2_deck.combo1, data.p2_deck.combo2, data.p2_deck.combo3].filter(Boolean));
    }

    loadRounds();
  }

  async function loadRounds() {
    const { data } = await supabase.from('rounds')
      .select('*')
      .eq('battle_id', battleId)
      .order('round_number');
    setRounds(data ?? []);
  }

  if (!battle) return null;

  const p1Score = rounds.reduce((s, r) => s + (r.winner_side === 'p1' ? r.points_awarded : 0), 0);
  const p2Score = rounds.reduce((s, r) => s + (r.winner_side === 'p2' ? r.points_awarded : 0), 0);
  const currentRound = rounds.length + 1;
  const isComplete = battle.status === 'completed';
  const mySide = userId === battle.player1_user_id ? 'p1' : 'p2';

  const p1Name = battle.player1_guest_name ?? 'P1';
  const p2Name = battle.player2_guest_name ?? 'P2';

  // Submit a round
  async function submitRound() {
    if (!selectedWinner || !selectedFinish) return;

    const finishData = FINISH_TYPES.find(f => f.id === selectedFinish);

    await supabase.from('rounds').insert({
      battle_id:      battleId,
      round_number:   currentRound,
      p1_combo_id:    selectedP1Combo?.id ?? null,
      p2_combo_id:    selectedP2Combo?.id ?? null,
      p1_combo_label: selectedP1Combo
        ? [selectedP1Combo.blade?.name, selectedP1Combo.ratchet?.name, selectedP1Combo.bit?.name].filter(Boolean).join(' ')
        : null,
      p2_combo_label: selectedP2Combo
        ? [selectedP2Combo.blade?.name, selectedP2Combo.ratchet?.name, selectedP2Combo.bit?.name].filter(Boolean).join(' ')
        : null,
      winner_side:    selectedWinner,
      finish_type:    selectedFinish,
      points_awarded: finishData?.points ?? 0,
      [`confirmed_by_${mySide}`]: true,
    });

    // Reset selections
    setSelectedP1Combo(null);
    setSelectedP2Combo(null);
    setSelectedWinner(null);
    setSelectedFinish(null);
  }

  // Confirm opponent's round
  async function confirmRound(roundId) {
    await supabase.from('rounds')
      .update({ [`confirmed_by_${mySide}`]: true })
      .eq('id', roundId);
  }

  return (
    <PageContainer>
      {/* Header: back + match info */}
      <div className="px-4 mb-4 flex items-center gap-3">
        <button onClick={() => navigate('/battle')}
          className="p-2 rounded-xl bg-white/5 text-white/70">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-center">
          <div className="text-[10px] font-bold text-white/40 tracking-[0.15em]">
            {battle.is_official ? '⚔️ UFFICIALE' : 'AMICHEVOLE'} · ROUND {currentRound}
          </div>
          <div className="text-[10px] text-white/30">
            Primo a {battle.point_target} punti
          </div>
        </div>
        <div className="w-10" /> {/* spacer */}
      </div>

      {/* ─── SCOREBOARD ─── */}
      <div className="mx-4 mb-6 rounded-2xl overflow-hidden border border-white/10"
        style={{ background: 'linear-gradient(135deg, #1A1A3A, #0F0F25)' }}>
        <div className="grid grid-cols-3 p-4">
          {/* P1 */}
          <div className="text-center">
            <div className="text-[10px] font-bold text-[#E94560] tracking-wider mb-1">
              {p1Name}
            </div>
            <motion.div
              key={p1Score}
              className="text-5xl font-black text-white tabular-nums"
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {p1Score}
            </motion.div>
          </div>

          {/* VS divider */}
          <div className="flex items-center justify-center">
            <div className="text-white/20 font-black text-xl">VS</div>
          </div>

          {/* P2 */}
          <div className="text-center">
            <div className="text-[10px] font-bold text-[#4361EE] tracking-wider mb-1">
              {p2Name}
            </div>
            <motion.div
              key={p2Score}
              className="text-5xl font-black text-white tabular-nums"
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {p2Score}
            </motion.div>
          </div>
        </div>

        {/* Point target bar */}
        <div className="px-4 pb-3">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
            <motion.div
              className="h-full bg-[#E94560]"
              animate={{ width: `${(p1Score / battle.point_target) * 50}%` }}
            />
            <div className="flex-1" />
            <motion.div
              className="h-full bg-[#4361EE]"
              animate={{ width: `${(p2Score / battle.point_target) * 50}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── MATCH COMPLETED ─── */}
      {isComplete && (
        <motion.div
          className="mx-4 mb-6 p-6 rounded-2xl text-center border"
          style={{
            background: 'linear-gradient(135deg, rgba(245,166,35,0.1), rgba(233,69,96,0.1))',
            borderColor: '#F5A623',
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Trophy size={40} className="text-[#F5A623] mx-auto mb-3" />
          <div className="text-white text-2xl font-black uppercase mb-1">
            {battle.winner_side === 'p1' ? p1Name : p2Name} VINCE!
          </div>
          <div className="text-white/50 text-sm">
            {p1Score} - {p2Score} · {rounds.length} round
          </div>
        </motion.div>
      )}

      {/* ─── ACTIVE: ROUND INPUT ─── */}
      {!isComplete && (
        <div className="mx-4 mb-6">
          {/* Combo selection for this round */}
          {battle.format === '3v3' && (
            <>
              <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3">
                COMBO PER QUESTO ROUND
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <ComboSelector
                  label={p1Name}
                  combos={p1Combos}
                  selected={selectedP1Combo}
                  onSelect={setSelectedP1Combo}
                  accentColor="#E94560"
                />
                <ComboSelector
                  label={p2Name}
                  combos={p2Combos}
                  selected={selectedP2Combo}
                  onSelect={setSelectedP2Combo}
                  accentColor="#4361EE"
                />
              </div>
            </>
          )}

          {/* Winner selector */}
          <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3">
            CHI HA VINTO QUESTO ROUND?
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => setSelectedWinner('p1')}
              className={`py-4 rounded-xl border-2 font-bold text-sm transition-all
                ${selectedWinner === 'p1'
                  ? 'bg-[#E94560] border-[#E94560] text-white'
                  : 'bg-[#12122A] border-white/10 text-white/50'}`}
            >
              {p1Name}
            </button>
            <button
              onClick={() => { setSelectedWinner('draw'); setSelectedFinish('draw'); }}
              className={`py-4 rounded-xl border-2 font-bold text-xs transition-all
                ${selectedWinner === 'draw'
                  ? 'bg-white/20 border-white/40 text-white'
                  : 'bg-[#12122A] border-white/10 text-white/50'}`}
            >
              DRAW
            </button>
            <button
              onClick={() => setSelectedWinner('p2')}
              className={`py-4 rounded-xl border-2 font-bold text-sm transition-all
                ${selectedWinner === 'p2'
                  ? 'bg-[#4361EE] border-[#4361EE] text-white'
                  : 'bg-[#12122A] border-white/10 text-white/50'}`}
            >
              {p2Name}
            </button>
          </div>

          {/* Finish type grid */}
          {selectedWinner && selectedWinner !== 'draw' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3">
                TIPO DI FINISH
              </div>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {FINISH_TYPES.filter(f => f.id !== 'draw').map(ft => {
                  const Icon = ft.icon;
                  const selected = selectedFinish === ft.id;
                  return (
                    <button
                      key={ft.id}
                      onClick={() => setSelectedFinish(ft.id)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all
                        ${selected ? '' : 'border-white/10 bg-[#12122A]'}`}
                      style={selected ? {
                        background: `${ft.color}15`,
                        borderColor: ft.color,
                      } : undefined}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={16} style={{ color: ft.color }} />
                        <span className="text-white font-bold text-sm">{ft.name}</span>
                      </div>
                      <span
                        className="text-xs font-extrabold"
                        style={{ color: ft.color }}
                      >
                        +{ft.points} PT
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Submit round */}
          <motion.button
            onClick={submitRound}
            disabled={!selectedWinner || (!selectedFinish && selectedWinner !== 'draw')}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-xl font-bold tracking-wider text-white
              disabled:opacity-30"
            style={{
              background: 'linear-gradient(135deg, #E94560, #C9304A)',
              boxShadow: '0 4px 20px -4px rgba(233,69,96,0.5)',
            }}
          >
            CONFERMA ROUND {currentRound}
          </motion.button>
        </div>
      )}

      {/* ─── ROUND HISTORY ─── */}
      {rounds.length > 0 && (
        <div className="mx-4 mb-6">
          <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3">
            STORICO ROUND
          </div>
          <div className="space-y-1.5">
            {rounds.map(r => {
              const ft = FINISH_TYPES.find(f => f.id === r.finish_type);
              const needsConfirm =
                (mySide === 'p1' && !r.confirmed_by_p1) ||
                (mySide === 'p2' && !r.confirmed_by_p2);

              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-[#12122A] border border-white/5"
                >
                  <div className="text-white/30 font-bold text-xs w-6 text-center">
                    R{r.round_number}
                  </div>

                  {/* Combo labels */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-white/60 truncate">
                      {r.p1_combo_label ?? '—'} vs {r.p2_combo_label ?? '—'}
                    </div>
                  </div>

                  {/* Finish badge */}
                  {ft && (
                    <div
                      className="text-[9px] font-extrabold px-2 py-1 rounded"
                      style={{
                        color: ft.color,
                        background: `${ft.color}15`,
                      }}
                    >
                      {ft.name.toUpperCase()} +{ft.points}
                    </div>
                  )}

                  {/* Winner indicator */}
                  <div className={`text-xs font-black ${
                    r.winner_side === 'p1' ? 'text-[#E94560]' :
                    r.winner_side === 'p2' ? 'text-[#4361EE]' :
                    'text-white/30'
                  }`}>
                    {r.winner_side === 'p1' ? 'P1' : r.winner_side === 'p2' ? 'P2' : '—'}
                  </div>

                  {/* Confirmation needed */}
                  {needsConfirm && (
                    <button
                      onClick={() => confirmRound(r.id)}
                      className="text-[9px] font-bold px-2 py-1 rounded bg-[#F5A623]/15
                        text-[#F5A623] border border-[#F5A623]/30"
                    >
                      CONFERMA
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function ComboSelector({ label, combos, selected, onSelect, accentColor }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="text-[9px] font-bold tracking-wider mb-1.5"
        style={{ color: accentColor }}>
        {label.toUpperCase()}
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-2.5 rounded-lg bg-[#12122A] border border-white/10 text-left"
      >
        <div className="text-white text-xs font-bold truncate">
          {selected
            ? [selected.blade?.name, selected.ratchet?.name, selected.bit?.name].filter(Boolean).join(' ')
            : 'Seleziona combo'}
        </div>
      </button>

      {open && (
        <motion.div
          className="mt-1 space-y-1"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {combos.map(c => (
            <button
              key={c.id}
              onClick={() => { onSelect(c); setOpen(false); }}
              className={`w-full p-2 rounded-lg text-left text-[10px] font-bold transition-colors
                ${selected?.id === c.id
                  ? `bg-opacity-10 border`
                  : 'bg-white/5 hover:bg-white/10'}`}
              style={selected?.id === c.id ? {
                background: `${accentColor}10`,
                borderColor: `${accentColor}40`,
                color: 'white',
              } : { color: 'rgba(255,255,255,0.7)' }}
            >
              {[c.blade?.name, c.ratchet?.name, c.bit?.name].filter(Boolean).join(' ')}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
```

### Route per il live match

```jsx
<Route path="/battle/live/:battleId" element={<LiveMatchPage />} />
```

---

## 4. Tournament Updates

### Iscrizioni Aperte

```jsx
// components/battle/TournamentRegistration.jsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Check, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';

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
```

---

## 5. Leaderboard Avanzata con Statistiche

### RPC Supabase per statistiche aggregate

```sql
-- ════════════════════════════════════════════════════════════════
-- LEADERBOARD RPCs — statistiche granulari da rounds
-- ════════════════════════════════════════════════════════════════

-- Helper: combo vincente = la combo usata nel round dal vincitore
-- Per P1 che vince: p1_combo_id. Per P2 che vince: p2_combo_id.

-- ────────────────────────────────────────────────────
-- Combo più vincente (per periodo)
-- ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION leaderboard_top_combos(
  p_since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  combo_id UUID,
  combo_name TEXT,
  wins BIGINT,
  total_rounds BIGINT,
  win_rate NUMERIC
) AS $$
  WITH winning_combos AS (
    SELECT
      CASE WHEN r.winner_side = 'p1' THEN r.p1_combo_id
           WHEN r.winner_side = 'p2' THEN r.p2_combo_id
      END AS combo_id,
      CASE WHEN r.winner_side = 'p1' THEN r.p1_combo_label
           WHEN r.winner_side = 'p2' THEN r.p2_combo_label
      END AS combo_label
    FROM rounds r
    JOIN battles b ON b.id = r.battle_id
    WHERE r.created_at >= p_since
      AND r.winner_side IN ('p1', 'p2')
      AND b.is_official = true
  ),
  combo_stats AS (
    SELECT
      combo_id,
      combo_label AS combo_name,
      COUNT(*) AS wins
    FROM winning_combos
    WHERE combo_id IS NOT NULL
    GROUP BY combo_id, combo_label
  ),
  combo_totals AS (
    SELECT
      combo_id,
      COUNT(*) AS total_rounds
    FROM (
      SELECT p1_combo_id AS combo_id FROM rounds r
        JOIN battles b ON b.id = r.battle_id
        WHERE r.created_at >= p_since AND b.is_official = true AND p1_combo_id IS NOT NULL
      UNION ALL
      SELECT p2_combo_id FROM rounds r
        JOIN battles b ON b.id = r.battle_id
        WHERE r.created_at >= p_since AND b.is_official = true AND p2_combo_id IS NOT NULL
    ) x
    GROUP BY combo_id
  )
  SELECT
    cs.combo_id,
    cs.combo_name,
    cs.wins,
    ct.total_rounds,
    ROUND(cs.wins * 100.0 / NULLIF(ct.total_rounds, 0), 1) AS win_rate
  FROM combo_stats cs
  JOIN combo_totals ct ON ct.combo_id = cs.combo_id
  ORDER BY cs.wins DESC
  LIMIT p_limit;
$$ LANGUAGE SQL STABLE;

-- ────────────────────────────────────────────────────
-- Combo con più finish di un tipo specifico
-- ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION leaderboard_top_finish_combos(
  p_finish_type TEXT,
  p_since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  combo_id UUID,
  combo_name TEXT,
  finish_count BIGINT
) AS $$
  SELECT
    CASE WHEN r.winner_side = 'p1' THEN r.p1_combo_id
         WHEN r.winner_side = 'p2' THEN r.p2_combo_id
    END AS combo_id,
    CASE WHEN r.winner_side = 'p1' THEN r.p1_combo_label
         WHEN r.winner_side = 'p2' THEN r.p2_combo_label
    END AS combo_name,
    COUNT(*) AS finish_count
  FROM rounds r
  JOIN battles b ON b.id = r.battle_id
  WHERE r.finish_type = p_finish_type
    AND r.winner_side IN ('p1', 'p2')
    AND r.created_at >= p_since
    AND b.is_official = true
  GROUP BY 1, 2
  HAVING CASE WHEN r.winner_side = 'p1' THEN r.p1_combo_id
              WHEN r.winner_side = 'p2' THEN r.p2_combo_id
         END IS NOT NULL
  ORDER BY finish_count DESC
  LIMIT p_limit;
$$ LANGUAGE SQL STABLE;

-- ────────────────────────────────────────────────────
-- Utenti con più vittorie (match, non round)
-- ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION leaderboard_top_players(
  p_since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  avatar_id TEXT,
  elo INT,
  wins BIGINT,
  total_matches BIGINT,
  win_rate NUMERIC
) AS $$
  WITH player_matches AS (
    SELECT
      p.id AS user_id,
      p.username,
      p.avatar_id,
      p.elo,
      COUNT(*) AS total_matches,
      COUNT(*) FILTER (
        WHERE (b.player1_user_id = p.id AND b.winner_side = 'p1')
           OR (b.player2_user_id = p.id AND b.winner_side = 'p2')
      ) AS wins
    FROM profiles p
    JOIN battles b ON (b.player1_user_id = p.id OR b.player2_user_id = p.id)
    WHERE b.status = 'completed'
      AND b.is_official = true
      AND b.played_at >= p_since
    GROUP BY p.id, p.username, p.avatar_id, p.elo
  )
  SELECT
    user_id, username, avatar_id, elo,
    wins, total_matches,
    ROUND(wins * 100.0 / NULLIF(total_matches, 0), 1) AS win_rate
  FROM player_matches
  ORDER BY wins DESC
  LIMIT p_limit;
$$ LANGUAGE SQL STABLE;
```

### Leaderboard Page Aggiornata

```jsx
// pages/LeaderboardPage.jsx — UPDATED with tabs for different stat views

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, Zap, Target, Flame, RotateCcw, Crown, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageContainer } from '../components/PageContainer';
import { Avatar } from '../components/Avatar';
import { RankBadge, getRankFromElo } from '../components/RankBadge';

const TABS = [
  { id: 'elo',          label: 'ELO',            icon: Crown },
  { id: 'wins',         label: 'VITTORIE',       icon: Trophy },
  { id: 'top_combo',    label: 'TOP COMBO',      icon: TrendingUp },
  { id: 'burst',        label: 'BURST',          icon: Zap },
  { id: 'ko',           label: 'KO',             icon: Target },
  { id: 'xtreme',       label: 'XTREME',         icon: Flame },
  { id: 'spin_finish',  label: 'SPIN',           icon: RotateCcw },
];

const PERIODS = [
  { id: 'week',  label: 'SETTIMANA', interval: '7 days' },
  { id: 'month', label: 'MESE',      interval: '30 days' },
  { id: 'all',   label: 'TOTALE',    interval: '100 years' },
];

export function LeaderboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('elo');
  const [activePeriod, setActivePeriod] = useState('week');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab, activePeriod]);

  async function loadData() {
    setLoading(true);
    const period = PERIODS.find(p => p.id === activePeriod);
    const since = new Date(Date.now() - parseDays(period.interval) * 86400000).toISOString();

    let result;

    switch (activeTab) {
      case 'elo':
        result = await supabase.from('profiles')
          .select('id, username, avatar_id, elo, elo_matches')
          .gte('elo_matches', 5)
          .order('elo', { ascending: false })
          .limit(50);
        setData((result.data ?? []).map(u => ({
          label: u.username,
          sublabel: `${u.elo} ELO`,
          value: u.elo,
          avatarId: u.avatar_id,
          userId: u.id,
          elo: u.elo,
        })));
        break;

      case 'wins':
        result = await supabase.rpc('leaderboard_top_players', { p_since: since });
        setData((result.data ?? []).map(u => ({
          label: u.username,
          sublabel: `${u.wins}V / ${u.total_matches}M · ${u.win_rate}%`,
          value: u.wins,
          avatarId: u.avatar_id,
          userId: u.user_id,
          elo: u.elo,
        })));
        break;

      case 'top_combo':
        result = await supabase.rpc('leaderboard_top_combos', { p_since: since });
        setData((result.data ?? []).map(c => ({
          label: c.combo_name ?? 'Unknown',
          sublabel: `${c.wins}V / ${c.total_rounds}R · ${c.win_rate}% win rate`,
          value: c.wins,
          isCombo: true,
        })));
        break;

      case 'burst':
      case 'ko':
      case 'xtreme':
      case 'spin_finish':
        result = await supabase.rpc('leaderboard_top_finish_combos', {
          p_finish_type: activeTab,
          p_since: since,
        });
        setData((result.data ?? []).map(c => ({
          label: c.combo_name ?? 'Unknown',
          sublabel: `${c.finish_count} ${activeTab} finish`,
          value: c.finish_count,
          isCombo: true,
        })));
        break;
    }

    setLoading(false);
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="px-4 mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 text-white/70">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#F5A623]">
            ▲ LEADERBOARD
          </div>
          <h1 className="text-white text-2xl font-black uppercase tracking-tight">
            Classifiche
          </h1>
        </div>
      </div>

      {/* Tab selector (horizontal scroll) */}
      <div className="px-4 mb-4 overflow-x-auto">
        <div className="flex gap-1.5 pb-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px]
                  font-extrabold tracking-wider whitespace-nowrap border transition-colors
                  ${active
                    ? 'bg-[#F5A623]/15 border-[#F5A623]/50 text-[#F5A623]'
                    : 'bg-white/5 border-white/10 text-white/50'}`}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Period filter (not shown for ELO which is all-time) */}
      {activeTab !== 'elo' && (
        <div className="px-4 mb-4 flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePeriod(p.id)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold tracking-wider
                border transition-colors
                ${activePeriod === p.id
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-white/5 text-white/40'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Results list */}
      <div className="px-4 space-y-2">
        {data.map((item, i) => {
          const rank = item.elo ? getRankFromElo(item.elo) : null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#12122A] border border-white/5"
            >
              {/* Position */}
              <div className={`w-7 text-center font-black tabular-nums ${
                i === 0 ? 'text-[#F5A623] text-lg' :
                i === 1 ? 'text-[#94A3B8] text-base' :
                i === 2 ? 'text-[#A16207] text-base' :
                'text-white/30 text-sm'
              }`}>
                {i + 1}
              </div>

              {/* Avatar (for users) or combo icon */}
              {item.avatarId ? (
                <Avatar avatarId={item.avatarId} size={40} />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <TrendingUp size={16} className="text-white/40" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm truncate">{item.label}</div>
                <div className="text-white/40 text-[10px] truncate">{item.sublabel}</div>
              </div>

              {/* Value + rank badge */}
              <div className="text-right">
                <div className="text-white font-black tabular-nums">
                  {item.value}
                </div>
                {rank && (
                  <div className="text-[9px] font-extrabold tracking-wider"
                    style={{ color: rank.tier.color }}>
                    {rank.display}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {data.length === 0 && !loading && (
          <div className="text-center py-8 text-white/30 text-sm">
            Nessun dato per questo periodo
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function parseDays(interval) {
  const match = interval.match(/(\d+)\s*(days?|years?)/);
  if (!match) return 7;
  const [, num, unit] = match;
  return unit.startsWith('year') ? parseInt(num) * 365 : parseInt(num);
}
```

---

## 6. Implementation Checklist

### Database (run first)
1. ✅ **Create `rounds` table** + indexes
2. ✅ **Create `finish_types` table** + seed data
3. ✅ **Create `tournament_registrations` table**
4. ✅ **Alter `battles` table** — add `point_target`, `status`, deck IDs, `admin_user_id`
5. ✅ **Alter `tournaments` table** — add `registration_mode`, `point_target`, `registration_open`
6. ✅ **Create trigger `check_match_completion`** — auto-complete on target reached
7. ✅ **Create RPC functions** — `leaderboard_top_combos`, `leaderboard_top_finish_combos`, `leaderboard_top_players`
8. ✅ **RLS policies** for all new tables

### Components & Pages
9. ✅ **Create `NewMatchPage.jsx`** — 3-step match creation (players → settings → decks)
10. ✅ **Create `LiveMatchPage.jsx`** — round-by-round scoreboard + finish selector + confirmation
11. ✅ **Create `DeckPicker.jsx`** — deck/combo selection with "crea nuova" option
12. ✅ **Create `TournamentRegistration.jsx`** — open registration with deck
13. ✅ **Update `LeaderboardPage.jsx`** — 7 tabs + period filters + combo stats
14. ✅ **Add route** `/battle/live/:battleId`

### Integration
15. ✅ **Update `BattlePage.jsx`** hub — link to `NewMatchPage` instead of old flow
16. ✅ **Realtime subscription** in LiveMatchPage for two-player confirmation
17. ✅ **Connect ELO trigger** to fire after `battles.status = 'completed'`
18. ✅ **Test full flow**: Create match → Select decks → Play rounds → Auto-complete → ELO update → Leaderboard reflects data

---

*End of Briefing — BeyManager X Battle System V2 — April 2026*

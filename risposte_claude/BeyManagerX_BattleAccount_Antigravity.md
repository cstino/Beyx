# BeyManager X — Battle & Account Menus: Full Implementation

**Briefing for Antigravity — April 2026**

---

Hey Antigravity — time to build the two final menus. This is a bigger briefing because it covers two full sections of the app. I've structured it so you can implement Battle first (more complex), then Account (mostly presentation layer). Both menus share some data via Supabase, so the schema changes are listed once at the top.

Given the scope, I recommend implementing in this order to keep things manageable:
1. **Database schema** — all SQL migrations at once
2. **Battle: 1v1 logging** — simplest flow, validates the data model
3. **Battle: 3v3 Deck format** — extends 1v1 with deck structure
4. **Battle: Tournament mode** — most complex, bracket generation
5. **Account: Profile + stats** — consumes battle data
6. **Account: Avatars + title editing** — presentation only
7. **Account: Achievements** — triggered by milestones

---

## 1. Database Schema

### Battles & Tournaments Tables

```sql
-- ────────────────────────────────────────────────────
-- BATTLES TABLE — every individual match across all formats
-- ────────────────────────────────────────────────────
CREATE TABLE battles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format             TEXT NOT NULL CHECK (format IN ('1v1', '3v3', 'tournament')),
  tournament_id      UUID REFERENCES tournaments(id) ON DELETE CASCADE,

  -- Players: can be a registered user OR a guest (free text)
  player1_user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player1_guest_name TEXT,
  player2_user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player2_guest_name TEXT,

  -- Combos used (optional for guests without app accounts)
  player1_combo_id   UUID REFERENCES combos(id) ON DELETE SET NULL,
  player2_combo_id   UUID REFERENCES combos(id) ON DELETE SET NULL,

  -- Outcome
  winner_side        TEXT CHECK (winner_side IN ('p1', 'p2', 'draw')),
  win_type           TEXT CHECK (win_type IN ('burst', 'ko', 'spin_finish', 'xtreme', 'draw')),
  points_p1          INT DEFAULT 0,  -- points scored by p1 this match
  points_p2          INT DEFAULT 0,  -- points scored by p2 this match

  -- Context
  notes              TEXT,
  played_at          TIMESTAMPTZ DEFAULT NOW(),
  created_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Integrity: must have at least a name per side
  CHECK (player1_user_id IS NOT NULL OR player1_guest_name IS NOT NULL),
  CHECK (player2_user_id IS NOT NULL OR player2_guest_name IS NOT NULL)
);

CREATE INDEX idx_battles_p1_user   ON battles(player1_user_id);
CREATE INDEX idx_battles_p2_user   ON battles(player2_user_id);
CREATE INDEX idx_battles_tournament ON battles(tournament_id);
CREATE INDEX idx_battles_played_at  ON battles(played_at DESC);

-- ────────────────────────────────────────────────────
-- TOURNAMENTS TABLE — bracket and round-robin events
-- ────────────────────────────────────────────────────
CREATE TABLE tournaments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  format       TEXT NOT NULL CHECK (format IN ('bracket', 'round_robin')),
  battle_type  TEXT NOT NULL CHECK (battle_type IN ('1v1', '3v3')),
  status       TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'completed')),

  -- Participants stored as JSONB array of { user_id?, guest_name?, seed }
  participants JSONB NOT NULL DEFAULT '[]',

  -- Bracket structure (for bracket format) or standings (for round robin)
  -- Shape for bracket: [ { round, match_index, p1, p2, winner, battle_id } ]
  -- Shape for RR:      [ { user_id/guest, wins, losses, points } ]
  structure    JSONB NOT NULL DEFAULT '[]',

  winner_user_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  winner_guest_name TEXT,

  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tournaments_status     ON tournaments(status);
CREATE INDEX idx_tournaments_created_by ON tournaments(created_by);

-- ────────────────────────────────────────────────────
-- DECKS TABLE — 3v3 deck composition for quick reuse
-- ────────────────────────────────────────────────────
CREATE TABLE decks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  combo1_id    UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  combo2_id    UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  combo3_id    UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),

  CHECK (combo1_id <> combo2_id AND combo2_id <> combo3_id AND combo1_id <> combo3_id)
);

CREATE INDEX idx_decks_user ON decks(user_id);
```

### Profile Extensions

Add fields for avatar, title, achievements:

```sql
-- ────────────────────────────────────────────────────
-- PROFILE ADDITIONS
-- ────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Blader d''Elite';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT 'default';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#F5A623';

-- ────────────────────────────────────────────────────
-- ACHIEVEMENTS CATALOG — seeded list of unlockable badges
-- ────────────────────────────────────────────────────
CREATE TABLE achievements (
  id           TEXT PRIMARY KEY,          -- slug like 'first_battle', 'collector_10'
  name         TEXT NOT NULL,              -- 'First Blood'
  description  TEXT NOT NULL,              -- 'Registra la tua prima battaglia'
  icon         TEXT NOT NULL,              -- lucide icon name
  color        TEXT NOT NULL,              -- hex color for badge glow
  category     TEXT NOT NULL CHECK (category IN ('battle', 'collection', 'combo', 'special')),
  threshold    INT NOT NULL DEFAULT 1,     -- numeric value needed (e.g. 10 battles)
  sort_order   INT NOT NULL DEFAULT 0
);

-- ────────────────────────────────────────────────────
-- USER ACHIEVEMENTS — what each user has unlocked
-- ────────────────────────────────────────────────────
CREATE TABLE user_achievements (
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
```

### Achievement Seed Data

```sql
INSERT INTO achievements (id, name, description, icon, color, category, threshold, sort_order) VALUES
  -- Battle achievements
  ('first_battle',   'First Blood',      'Registra la tua prima battaglia',       'Swords',    '#E94560', 'battle',     1,   10),
  ('battle_10',      'Gladiatore',       'Vinci 10 battaglie',                     'Shield',    '#E94560', 'battle',     10,  20),
  ('battle_50',      'Campione',         'Vinci 50 battaglie',                     'Trophy',    '#F5A623', 'battle',     50,  30),
  ('battle_100',     'Leggenda',         'Vinci 100 battaglie',                    'Crown',     '#F5A623', 'battle',     100, 40),
  ('streak_3',       'Hat-Trick',        'Vinci 3 battaglie consecutive',          'Flame',     '#E94560', 'battle',     3,   50),
  ('streak_5',       'Invincibile',      'Vinci 5 battaglie consecutive',          'Zap',       '#F5A623', 'battle',     5,   60),
  ('tournament_win', 'Re del Torneo',    'Vinci il tuo primo torneo',              'Award',     '#F5A623', 'battle',     1,   70),

  -- Collection achievements
  ('collection_10',  'Collezionista',    'Possiedi 10 parti',                      'Package',   '#4361EE', 'collection', 10,  110),
  ('collection_25',  'Appassionato',     'Possiedi 25 parti',                      'Package',   '#4361EE', 'collection', 25,  120),
  ('collection_50',  'Archivista',       'Possiedi 50 parti',                      'PackagePlus','#4361EE','collection', 50,  130),
  ('collection_100', 'Curatore',         'Possiedi 100 parti',                     'PackageCheck','#F5A623','collection',100, 140),

  -- Combo achievements
  ('combo_5',        'Forgiatore',       'Crea 5 combo diversi',                   'Wrench',    '#E94560', 'combo',      5,   210),
  ('combo_15',       'Stratega',         'Crea 15 combo diversi',                  'Hammer',    '#E94560', 'combo',      15,  220),
  ('combo_30',       'Maestro Builder',  'Crea 30 combo diversi',                  'Cog',       '#F5A623', 'combo',      30,  230),

  -- Special achievements
  ('win_stamina',    'Re della Stamina', 'Vinci 20 battaglie con combo Stamina',  'Infinity',  '#00D68F', 'special',    20,  310),
  ('win_attack',     'Re dell''Attacco', 'Vinci 20 battaglie con combo Attack',   'Sword',     '#E94560', 'special',    20,  320),
  ('win_defense',    'Re della Difesa',  'Vinci 20 battaglie con combo Defense',  'Shield',    '#4361EE', 'special',    20,  330);
```

### Triggers for XP & Achievements

Extend the existing battle XP trigger to also check for achievement unlocks:

```sql
-- Award XP on battle insert (existing, just confirm it's there)
CREATE OR REPLACE FUNCTION award_battle_xp()
RETURNS TRIGGER AS $$
DECLARE
  winner_id UUID;
  loser_id  UUID;
BEGIN
  IF NEW.winner_side = 'p1' THEN
    winner_id := NEW.player1_user_id;
    loser_id  := NEW.player2_user_id;
  ELSIF NEW.winner_side = 'p2' THEN
    winner_id := NEW.player2_user_id;
    loser_id  := NEW.player1_user_id;
  END IF;

  IF winner_id IS NOT NULL THEN
    UPDATE profiles SET xp = xp + 30, updated_at = NOW() WHERE id = winner_id;
  END IF;
  IF loser_id IS NOT NULL THEN
    UPDATE profiles SET xp = xp + 20, updated_at = NOW() WHERE id = loser_id;
  END IF;

  -- Check for new achievements for the winner
  IF winner_id IS NOT NULL THEN
    PERFORM check_battle_achievements(winner_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_battle_xp ON battles;
CREATE TRIGGER trg_battle_xp
  AFTER INSERT ON battles
  FOR EACH ROW EXECUTE FUNCTION award_battle_xp();

-- Achievement checker — runs after each win
CREATE OR REPLACE FUNCTION check_battle_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  win_count INT;
BEGIN
  SELECT COUNT(*) INTO win_count
  FROM battles
  WHERE (player1_user_id = p_user_id AND winner_side = 'p1')
     OR (player2_user_id = p_user_id AND winner_side = 'p2');

  -- Unlock thresholds
  IF win_count >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'first_battle') ON CONFLICT DO NOTHING;
  END IF;
  IF win_count >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'battle_10') ON CONFLICT DO NOTHING;
  END IF;
  IF win_count >= 50 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'battle_50') ON CONFLICT DO NOTHING;
  END IF;
  IF win_count >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'battle_100') ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies

```sql
ALTER TABLE battles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements  ENABLE ROW LEVEL SECURITY;

-- Battles: all users can read, creator can insert
CREATE POLICY battles_select ON battles FOR SELECT USING (true);
CREATE POLICY battles_insert ON battles FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Tournaments: all can read, creator can insert/update
CREATE POLICY tournaments_select ON tournaments FOR SELECT USING (true);
CREATE POLICY tournaments_insert ON tournaments FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY tournaments_update ON tournaments FOR UPDATE
  USING (auth.uid() = created_by);

-- Decks: users manage their own
CREATE POLICY decks_all ON decks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Achievements: public catalog
CREATE POLICY achievements_select ON achievements FOR SELECT USING (true);

-- User achievements: all can read (for leaderboard display)
CREATE POLICY user_achievements_select ON user_achievements FOR SELECT USING (true);
```

---

## 2. Battle Menu

### Entry Page

Replace the `ComingSoon` placeholder with a hub that shows three format tiles and recent battles:

```jsx
// pages/BattlePage.jsx

import { useState } from 'react';
import { Swords, Users, Trophy, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../components/SectionHeader';
import { RecentBattlesList } from '../components/battle/RecentBattlesList';

const FORMATS = [
  {
    key: '1v1',
    icon: Swords,
    title: '1v1',
    subtitle: 'Battaglia singola',
    color: '#E94560',
    path: '/battle/new/1v1',
  },
  {
    key: '3v3',
    icon: Users,
    title: '3v3',
    subtitle: 'Deck format',
    color: '#4361EE',
    path: '/battle/new/3v3',
  },
  {
    key: 'tournament',
    icon: Trophy,
    title: 'Torneo',
    subtitle: 'Bracket / Round Robin',
    color: '#F5A623',
    path: '/battle/new/tournament',
  },
];

export function BattlePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-24 px-4 pt-4">
      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-[3px] h-5 bg-[#E94560]" />
          <div className="text-[11px] font-extrabold text-white tracking-[0.15em]">
            BATTLE ARENA
          </div>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Inizia una battaglia
        </h1>
      </div>

      {/* Format tiles */}
      <div className="grid grid-cols-1 gap-3 mb-8">
        {FORMATS.map((fmt, i) => {
          const Icon = fmt.icon;
          return (
            <motion.button
              key={fmt.key}
              onClick={() => navigate(fmt.path)}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative overflow-hidden rounded-xl bg-[#12122A] p-4 flex items-center gap-4 border"
              style={{ borderColor: `${fmt.color}30` }}
            >
              {/* Diagonal glow */}
              <div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{
                  background: `linear-gradient(110deg, transparent 50%, ${fmt.color}15 80%, transparent 100%)`,
                }}
              />

              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border"
                style={{
                  background: `${fmt.color}15`,
                  borderColor: `${fmt.color}40`,
                  transform: 'rotate(-3deg)',
                }}
              >
                <Icon size={24} style={{ color: fmt.color }} strokeWidth={2.2} />
              </div>

              <div className="flex-1 text-left relative">
                <div className="text-white font-black text-lg leading-tight">
                  {fmt.title}
                </div>
                <div className="text-white/50 text-xs mt-0.5">
                  {fmt.subtitle}
                </div>
              </div>

              <Plus size={20} className="text-white/40 relative" strokeWidth={2.5} />
            </motion.button>
          );
        })}
      </div>

      {/* Recent battles */}
      <SectionHeader
        title="Battaglie Recenti"
        accentColor="#E94560"
        onSeeAll={() => navigate('/battle/history')}
      />
      <RecentBattlesList limit={5} />
    </div>
  );
}
```

### 1v1 Logging Flow

Four-step quick flow to log a battle:

```jsx
// pages/battle/New1v1Page.jsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlayerPicker } from '../../components/battle/PlayerPicker';
import { ComboPicker } from '../../components/battle/ComboPicker';
import { OutcomePicker } from '../../components/battle/OutcomePicker';
import { BattleSummary } from '../../components/battle/BattleSummary';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';

const STEPS = ['players', 'combos', 'outcome', 'confirm'];

export function New1v1Page() {
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);
  const [step, setStep] = useState(0);
  const [battle, setBattle] = useState({
    player1: { user_id: userId, guest_name: null, combo_id: null },
    player2: { user_id: null, guest_name: null, combo_id: null },
    winner_side: null,     // 'p1' | 'p2' | 'draw'
    win_type: null,        // 'burst' | 'ko' | 'spin_finish' | 'xtreme'
    notes: '',
  });

  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
  const prev = () => (step === 0 ? navigate(-1) : setStep(s => s - 1));

  async function handleSave() {
    const points = computePoints(battle.win_type);
    const { error } = await supabase.from('battles').insert({
      format:              '1v1',
      player1_user_id:     battle.player1.user_id,
      player1_guest_name:  battle.player1.guest_name,
      player1_combo_id:    battle.player1.combo_id,
      player2_user_id:     battle.player2.user_id,
      player2_guest_name:  battle.player2.guest_name,
      player2_combo_id:    battle.player2.combo_id,
      winner_side:         battle.winner_side,
      win_type:            battle.win_type,
      points_p1:           battle.winner_side === 'p1' ? points : 0,
      points_p2:           battle.winner_side === 'p2' ? points : 0,
      notes:               battle.notes,
      created_by:          userId,
    });

    if (error) {
      console.error(error);
      return;
    }
    navigate('/battle');
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-24">
      {/* Header with back + step indicator */}
      <div className="px-4 pt-4 pb-6 flex items-center gap-3">
        <button onClick={prev} className="p-2 rounded-xl bg-white/5 text-white/70">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-bold text-[#E94560] tracking-[0.15em]">
            STEP {step + 1} / {STEPS.length}
          </div>
          <div className="text-white font-black text-lg">
            {['Giocatori', 'Combo usati', 'Risultato', 'Conferma'][step]}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-4 h-1 rounded-full bg-white/5 overflow-hidden mb-6">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #4361EE, #E94560)' }}
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step content */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <PlayerPicker
                battle={battle}
                onChange={setBattle}
                onNext={next}
              />
            )}
            {step === 1 && (
              <ComboPicker
                battle={battle}
                onChange={setBattle}
                onNext={next}
              />
            )}
            {step === 2 && (
              <OutcomePicker
                battle={battle}
                onChange={setBattle}
                onNext={next}
              />
            )}
            {step === 3 && (
              <BattleSummary
                battle={battle}
                onSave={handleSave}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function computePoints(winType) {
  // Beyblade X official scoring
  switch (winType) {
    case 'burst':       return 2;
    case 'ko':          return 1;
    case 'xtreme':      return 2;
    case 'spin_finish': return 1;
    default:            return 0;
  }
}
```

### PlayerPicker Component

Supports both registered users and guest names:

```jsx
// components/battle/PlayerPicker.jsx

import { useState, useEffect } from 'react';
import { UserCircle2, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function PlayerPicker({ battle, onChange, onNext }) {
  const [users, setUsers] = useState([]);
  const [activeSlot, setActiveSlot] = useState('player2'); // p1 is always self

  useEffect(() => {
    supabase.from('profiles').select('id, username, avatar_id, avatar_color')
      .neq('id', battle.player1.user_id)
      .then(({ data }) => setUsers(data ?? []));
  }, [battle.player1.user_id]);

  const canProceed = battle.player2.user_id || battle.player2.guest_name;

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
    <div>
      <div className="text-white/60 text-sm mb-4">
        Chi combatte contro di te?
      </div>

      {/* Registered users */}
      <div className="space-y-2 mb-6">
        {users.map(u => {
          const selected = battle.player2.user_id === u.id;
          return (
            <button
              key={u.id}
              onClick={() => selectUser(u)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors
                ${selected
                  ? 'bg-[#E94560]/10 border-[#E94560]/50'
                  : 'bg-[#12122A] border-white/5 hover:border-white/15'}`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-[#0A0A1A]"
                style={{ background: u.avatar_color ?? '#F5A623' }}
              >
                {u.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-bold text-sm">{u.username}</div>
                <div className="text-white/40 text-xs">Blader registrato</div>
              </div>
              {selected && (
                <div className="w-5 h-5 rounded-full bg-[#E94560] flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Guest input */}
      <div className="pt-4 border-t border-white/5">
        <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-2">
          OPPURE OSPITE
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#12122A] border border-white/5">
          <UserPlus size={18} className="text-white/40" />
          <input
            type="text"
            placeholder="Nome ospite"
            value={battle.player2.guest_name ?? ''}
            onChange={e => setGuestName(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
          />
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full mt-8 py-4 rounded-xl font-bold tracking-wider text-white transition-all disabled:opacity-40"
        style={{
          background: 'linear-gradient(135deg, #E94560, #C9304A)',
          boxShadow: canProceed ? '0 4px 20px -4px rgba(233,69,96,0.5)' : 'none',
        }}
      >
        CONTINUA
      </button>
    </div>
  );
}
```

### ComboPicker Component

Shows the user's saved combos; skip button available (not always known for guests):

```jsx
// components/battle/ComboPicker.jsx

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';

export function ComboPicker({ battle, onChange, onNext }) {
  const userId = useAuthStore(s => s.user?.id);
  const [myCombos, setMyCombos] = useState([]);
  const [oppCombos, setOppCombos] = useState([]);
  const [activeSide, setActiveSide] = useState('p1');

  useEffect(() => {
    // My combos
    supabase.from('combos').select('id, name, combo_type, overall_score')
      .eq('user_id', userId)
      .then(({ data }) => setMyCombos(data ?? []));

    // Opponent's combos (only if they're a registered user)
    if (battle.player2.user_id) {
      supabase.from('combos').select('id, name, combo_type, overall_score')
        .eq('user_id', battle.player2.user_id)
        .then(({ data }) => setOppCombos(data ?? []));
    }
  }, [userId, battle.player2.user_id]);

  const combos = activeSide === 'p1' ? myCombos : oppCombos;
  const selectedId = activeSide === 'p1'
    ? battle.player1.combo_id
    : battle.player2.combo_id;

  function select(comboId) {
    const key = activeSide === 'p1' ? 'player1' : 'player2';
    onChange({
      ...battle,
      [key]: { ...battle[key], combo_id: comboId },
    });
  }

  return (
    <div>
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

      {combos.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-sm">
          {activeSide === 'p2' && !battle.player2.user_id
            ? 'Ospite: combo non tracciato'
            : 'Nessun combo salvato. Skippa per continuare.'}
        </div>
      ) : (
        <div className="space-y-2">
          {combos.map(c => {
            const selected = selectedId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => select(c.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors
                  ${selected
                    ? 'bg-white/5 border-[#E94560]/50'
                    : 'bg-[#12122A] border-white/5 hover:border-white/15'}`}
              >
                <div className="flex-1 text-left">
                  <div className="text-white font-bold text-sm">{c.name}</div>
                  <div className="text-white/40 text-xs capitalize">
                    {c.combo_type} · Score {c.overall_score}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-8">
        <button
          onClick={onNext}
          className="py-4 rounded-xl font-bold tracking-wider text-white/70 bg-white/5"
        >
          SKIP
        </button>
        <button
          onClick={onNext}
          className="py-4 rounded-xl font-bold tracking-wider text-white"
          style={{ background: 'linear-gradient(135deg, #E94560, #C9304A)' }}
        >
          CONTINUA
        </button>
      </div>
    </div>
  );
}
```

### OutcomePicker Component

Visual winner selector + win type grid:

```jsx
// components/battle/OutcomePicker.jsx

import { Zap, Target, Infinity as InfIcon, Wind } from 'lucide-react';

const WIN_TYPES = [
  { key: 'burst',       label: 'Burst Finish',   points: 2, icon: Zap,     color: '#E94560' },
  { key: 'xtreme',      label: 'Xtreme Finish',  points: 2, icon: Target,  color: '#F5A623' },
  { key: 'ko',          label: 'KO Finish',      points: 1, icon: Wind,    color: '#4361EE' },
  { key: 'spin_finish', label: 'Spin Finish',    points: 1, icon: InfIcon, color: '#00D68F' },
];

export function OutcomePicker({ battle, onChange, onNext }) {
  const setWinner = (side) => onChange({ ...battle, winner_side: side });
  const setWinType = (type) => onChange({ ...battle, win_type: type });
  const canProceed = battle.winner_side && battle.win_type;

  const p1Label = battle.player1.user_id ? 'TU' : battle.player1.guest_name;
  const p2Label = battle.player2.guest_name
    ?? 'AVVERSARIO';

  return (
    <div>
      {/* Winner selector */}
      <div className="text-white/60 text-sm mb-3">Chi ha vinto?</div>
      <div className="grid grid-cols-3 gap-2 mb-8">
        <button
          onClick={() => setWinner('p1')}
          className={`py-5 rounded-xl border-2 transition-all font-black
            ${battle.winner_side === 'p1'
              ? 'bg-[#E94560] border-[#E94560] text-white'
              : 'bg-[#12122A] border-white/10 text-white/50'}`}
        >
          {p1Label}
        </button>
        <button
          onClick={() => setWinner('draw')}
          className={`py-5 rounded-xl border-2 transition-all font-black text-xs
            ${battle.winner_side === 'draw'
              ? 'bg-white/20 border-white/40 text-white'
              : 'bg-[#12122A] border-white/10 text-white/50'}`}
        >
          PAREGGIO
        </button>
        <button
          onClick={() => setWinner('p2')}
          className={`py-5 rounded-xl border-2 transition-all font-black
            ${battle.winner_side === 'p2'
              ? 'bg-[#4361EE] border-[#4361EE] text-white'
              : 'bg-[#12122A] border-white/10 text-white/50'}`}
        >
          {p2Label}
        </button>
      </div>

      {/* Win type grid */}
      {battle.winner_side && battle.winner_side !== 'draw' && (
        <>
          <div className="text-white/60 text-sm mb-3">Tipo di vittoria</div>
          <div className="grid grid-cols-2 gap-2 mb-8">
            {WIN_TYPES.map(wt => {
              const Icon = wt.icon;
              const selected = battle.win_type === wt.key;
              return (
                <button
                  key={wt.key}
                  onClick={() => setWinType(wt.key)}
                  className={`p-4 rounded-xl border-2 transition-all text-left
                    ${selected ? '' : 'border-white/10 bg-[#12122A]'}`}
                  style={selected ? {
                    background: `${wt.color}15`,
                    borderColor: wt.color,
                  } : undefined}
                >
                  <Icon size={20} style={{ color: wt.color }} strokeWidth={2.2} />
                  <div className="text-white font-bold text-sm mt-2">{wt.label}</div>
                  <div className="text-white/40 text-xs mt-0.5">{wt.points} punti</div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed && battle.winner_side !== 'draw'}
        className="w-full py-4 rounded-xl font-bold tracking-wider text-white transition-all disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #E94560, #C9304A)' }}
      >
        CONFERMA RISULTATO
      </button>
    </div>
  );
}
```

### 3v3 Deck Format

The 3v3 flow reuses the same components but orchestrates 3 matches. User picks a deck (or creates one on the fly) for each side, then logs 3 individual battles that are linked together:

```jsx
// pages/battle/New3v3Page.jsx

import { useState } from 'react';
import { DeckSelector } from '../../components/battle/DeckSelector';
import { Match3v3Tracker } from '../../components/battle/Match3v3Tracker';

export function New3v3Page() {
  const [stage, setStage] = useState('decks');  // 'decks' | 'playing' | 'done'
  const [myDeck, setMyDeck] = useState(null);
  const [oppDeck, setOppDeck] = useState(null);
  const [matches, setMatches] = useState([]);  // array of 3 battle results

  // Flow:
  // 1. 'decks' — pick your deck (3 combos) and opponent's deck (3 combos or guest)
  // 2. 'playing' — play up to 5 rounds. First to 3 points wins. Each round you pick which
  //    combo from your deck is used. Log the outcome. Score accumulates.
  // 3. 'done' — show summary, save all 3-5 battles to DB with the same tournament_id link
  //    (or a shared "deck_match_id" you add to the battles table if you prefer).

  // Rules:
  // - Players alternate revealing combos per round, Beyblade X deck rules
  // - Max 3 points per combo before it's "retired" for the match
  // - First player to accumulate 3 total points wins the deck match

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-24 px-4 pt-4">
      {stage === 'decks' && (
        <DeckSelector
          onConfirm={(my, opp) => {
            setMyDeck(my);
            setOppDeck(opp);
            setStage('playing');
          }}
        />
      )}
      {stage === 'playing' && (
        <Match3v3Tracker
          myDeck={myDeck}
          oppDeck={oppDeck}
          onComplete={(results) => {
            setMatches(results);
            setStage('done');
          }}
        />
      )}
      {stage === 'done' && (
        <div className="text-center py-10">
          <div className="text-white font-black text-2xl mb-2">Match completato!</div>
          <div className="text-white/50 text-sm mb-8">
            Tutte le battaglie sono state registrate.
          </div>
          <button onClick={() => window.location.href = '/battle'}
            className="px-6 py-3 rounded-xl bg-[#E94560] text-white font-bold">
            Torna a Battle
          </button>
        </div>
      )}
    </div>
  );
}
```

> 💡 For the 3v3 internal tracker, implement it as a round-by-round logger where each round is one `battles` row with `format='3v3'`. All rounds of the same match share a `tournament_id` pointing to an auto-created "virtual tournament" row (or add a dedicated `match_group_id` column if you prefer stricter semantics). This keeps your data model flat and reuses the stats queries later.

### Tournament Mode

Two tournament formats:

```jsx
// pages/battle/NewTournamentPage.jsx

import { useState } from 'react';
import { TournamentSetup } from '../../components/battle/TournamentSetup';
import { BracketView } from '../../components/battle/BracketView';
import { RoundRobinView } from '../../components/battle/RoundRobinView';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';

export function NewTournamentPage() {
  const userId = useAuthStore(s => s.user?.id);
  const [tournament, setTournament] = useState(null);

  async function handleSetup({ name, format, battleType, participants }) {
    // Generate initial bracket or round robin structure
    const structure = format === 'bracket'
      ? generateBracket(participants)
      : generateRoundRobin(participants);

    const { data, error } = await supabase.from('tournaments').insert({
      name,
      format,
      battle_type: battleType,
      participants,
      structure,
      status: 'active',
      created_by: userId,
    }).select().single();

    if (!error) setTournament(data);
  }

  if (!tournament) {
    return <TournamentSetup onConfirm={handleSetup} />;
  }

  return tournament.format === 'bracket'
    ? <BracketView tournament={tournament} onUpdate={setTournament} />
    : <RoundRobinView tournament={tournament} onUpdate={setTournament} />;
}

// ── Bracket generation (single elimination) ──
function generateBracket(participants) {
  // Shuffle participants with Fisher-Yates
  const shuffled = [...participants].sort(() => Math.random() - 0.5);

  // Pad to nearest power of 2 with "bye" slots
  const size = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
  while (shuffled.length < size) {
    shuffled.push({ bye: true });
  }

  // Generate first round matches
  const matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({
      round: 1,
      match_index: i / 2,
      p1: shuffled[i],
      p2: shuffled[i + 1],
      winner: shuffled[i + 1].bye ? shuffled[i] : null,   // auto-advance on bye
      battle_id: null,
    });
  }

  return matches;
}

// ── Round Robin generation ──
function generateRoundRobin(participants) {
  // Every participant plays every other participant once
  return participants.map(p => ({
    ...p,
    wins: 0,
    losses: 0,
    points: 0,
  }));
}
```

The `BracketView` and `RoundRobinView` components render the tournament state and let the user tap on each pending match to launch the 1v1 flow (or 3v3 flow if `battle_type='3v3'`) with the tournament context preloaded. When the battle is saved, the component updates the tournament structure in Supabase and recalculates standings.

---

## 3. Account Menu

### Account Page

Replace the `ComingSoon` placeholder with a real profile page:

```jsx
// pages/AccountPage.jsx

import { useState, useEffect } from 'react';
import { Edit3, Trophy, Package, Wrench, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { AvatarHex } from '../components/AvatarHex';
import { StatGrid } from '../components/account/StatGrid';
import { AchievementsGrid } from '../components/account/AchievementsGrid';
import { EditProfileModal } from '../components/account/EditProfileModal';

export function AccountPage() {
  const userId = useAuthStore(s => s.user?.id);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    if (!userId) return;

    const [p, s, a] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      fetchStats(userId),
      fetchAchievements(userId),
    ]);
    setProfile(p.data);
    setStats(s);
    setAchievements(a);
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-24">
      {/* Hero profile card */}
      <div className="px-4 pt-4 mb-6">
        <div
          className="rounded-2xl p-5 relative overflow-hidden border border-[#4361EE]/20"
          style={{ background: 'linear-gradient(135deg, #1A1A3A 0%, #0F0F25 100%)' }}
        >
          <div className="absolute top-3.5 right-3.5 w-[18px] h-[18px] opacity-60"
            style={{ borderTop: '2px solid #4361EE', borderRight: '2px solid #4361EE' }} />

          <div className="flex items-center gap-4 relative">
            <AvatarHex
              avatarId={profile.avatar_id}
              color={profile.avatar_color}
              username={profile.username}
              size={88}
            />

            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold tracking-[0.15em] text-[#4361EE] mb-0.5">
                ▲ LIVELLO {xpToLevel(profile.xp)}
              </div>
              <div className="text-white font-black text-xl leading-tight uppercase truncate">
                {profile.username}
              </div>
              <div className="text-[11px] text-white/50 mt-1 font-medium">
                {profile.title}
              </div>
            </div>

            <button
              onClick={() => setEditing(true)}
              className="p-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10"
            >
              <Edit3 size={16} />
            </button>
          </div>

          {/* XP bar */}
          <div className="mt-5 pt-4 border-t border-white/5">
            <div className="flex justify-between text-[10px] font-bold tracking-[0.1em] mb-1.5">
              <span className="text-white/50">XP</span>
              <span className="text-white/90 tabular-nums">
                {profile.xp} / {xpForNextLevel(profile.xp)}
              </span>
            </div>
            <div className="h-[5px] bg-white/8 rounded-sm overflow-hidden">
              <motion.div
                className="h-full rounded-sm"
                style={{ background: 'linear-gradient(90deg, #4361EE 0%, #E94560 100%)' }}
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress(profile.xp)}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-[3px] h-3.5 bg-[#E94560]" />
          <div className="text-[11px] font-extrabold text-white tracking-[0.15em]">
            STATISTICHE
          </div>
        </div>
        <StatGrid stats={stats} />
      </div>

      {/* Achievements */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-[3px] h-3.5 bg-[#F5A623]" />
            <div className="text-[11px] font-extrabold text-white tracking-[0.15em]">
              ACHIEVEMENT
            </div>
          </div>
          <div className="text-[10px] text-white/50 font-semibold">
            {achievements.filter(a => a.unlocked).length} / {achievements.length}
          </div>
        </div>
        <AchievementsGrid achievements={achievements} />
      </div>

      {/* Edit modal */}
      {editing && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); loadData(); }}
        />
      )}
    </div>
  );
}

function xpToLevel(xp) {
  return Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1);
}
function xpForNextLevel(xp) {
  const lvl = xpToLevel(xp);
  return lvl * lvl * 50;
}
function xpProgress(xp) {
  const lvl = xpToLevel(xp);
  const currentLevelStart = (lvl - 1) * (lvl - 1) * 50;
  const nextLevelStart = lvl * lvl * 50;
  return ((xp - currentLevelStart) / (nextLevelStart - currentLevelStart)) * 100;
}

async function fetchStats(userId) {
  // Aggregate stats from battles, collection, combos
  const [battles, ownedParts, combos, favoriteCombo] = await Promise.all([
    supabase.rpc('get_user_battle_stats', { user_id: userId }),
    supabase.from('user_collections').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('combos').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.rpc('get_favorite_combo', { user_id: userId }),
  ]);
  return {
    wins:         battles.data?.wins ?? 0,
    losses:       battles.data?.losses ?? 0,
    winRate:      battles.data?.win_rate ?? 0,
    totalBattles: battles.data?.total ?? 0,
    partsOwned:   ownedParts.count ?? 0,
    combosCount:  combos.count ?? 0,
    favoriteCombo: favoriteCombo.data,
  };
}

async function fetchAchievements(userId) {
  const { data: all } = await supabase.from('achievements').select('*').order('sort_order');
  const { data: unlocked } = await supabase.from('user_achievements')
    .select('achievement_id').eq('user_id', userId);
  const unlockedIds = new Set((unlocked ?? []).map(u => u.achievement_id));
  return (all ?? []).map(a => ({ ...a, unlocked: unlockedIds.has(a.id) }));
}
```

### AvatarHex Component

Preset avatars with hexagonal frame. Users pick from a gallery:

```jsx
// components/AvatarHex.jsx

// Predefined avatars — each is a combination of a color and an initial-based design
export const AVATAR_PRESETS = [
  { id: 'gold',     color: '#F5A623', gradient: ['#F5A623', '#D48919'] },
  { id: 'red',      color: '#E94560', gradient: ['#E94560', '#C9304A'] },
  { id: 'blue',     color: '#4361EE', gradient: ['#4361EE', '#2E45C9'] },
  { id: 'green',    color: '#00D68F', gradient: ['#00D68F', '#00A86F'] },
  { id: 'purple',   color: '#A855F7', gradient: ['#A855F7', '#8B3FD1'] },
  { id: 'cyan',     color: '#06B6D4', gradient: ['#06B6D4', '#0891B2'] },
  { id: 'crimson',  color: '#DC2626', gradient: ['#DC2626', '#991B1B'] },
  { id: 'mint',     color: '#10B981', gradient: ['#10B981', '#059669'] },
];

export function AvatarHex({ avatarId = 'gold', color, username, size = 68 }) {
  const preset = AVATAR_PRESETS.find(p => p.id === avatarId) ?? AVATAR_PRESETS[0];
  const bgColor = color ?? preset.color;
  const initial = username?.[0]?.toUpperCase() ?? '?';
  const fontSize = size * 0.4;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" className="w-full h-full absolute">
        <defs>
          <linearGradient id={`avatar-grad-${avatarId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={preset.gradient[0]} />
            <stop offset="100%" stopColor={preset.gradient[1]} />
          </linearGradient>
        </defs>
        <polygon
          points="40,4 72,22 72,58 40,76 8,58 8,22"
          fill={`url(#avatar-grad-${avatarId})`}
          stroke="#E94560" strokeWidth="1.5"
        />
        <polygon
          points="40,10 68,25 68,55 40,70 12,55 12,25"
          fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-black text-[#0A0A1A]"
        style={{ fontSize }}
      >
        {initial}
      </div>
    </div>
  );
}
```

### EditProfileModal

Lets the user change username, title, and pick an avatar from the preset gallery:

```jsx
// components/account/EditProfileModal.jsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AvatarHex, AVATAR_PRESETS } from '../AvatarHex';

const TITLE_OPTIONS = [
  "Blader d'Elite",
  "Cacciatore di Bit",
  "Re della Stamina",
  "Maestro dell'Attacco",
  "Guardiano della Difesa",
  "Esploratore del Meta",
  "Maestro Builder",
  "Leggenda Vivente",
];

export function EditProfileModal({ profile, onClose, onSaved }) {
  const [username, setUsername] = useState(profile.username);
  const [title, setTitle]       = useState(profile.title);
  const [avatarId, setAvatarId] = useState(profile.avatar_id);
  const [saving, setSaving]     = useState(false);

  async function handleSave() {
    setSaving(true);
    const preset = AVATAR_PRESETS.find(p => p.id === avatarId) ?? AVATAR_PRESETS[0];
    await supabase.from('profiles')
      .update({
        username,
        title,
        avatar_id: avatarId,
        avatar_color: preset.color,
      })
      .eq('id', profile.id);
    setSaving(false);
    onSaved();
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden bg-[#12122A] border-t border-[#4361EE]/30"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pb-8 pt-3 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="text-white text-lg font-black uppercase tracking-tight">
              Modifica Profilo
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-white/40">
              <X size={18} />
            </button>
          </div>

          {/* Username */}
          <div className="mb-5">
            <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-2">
              NOME BLADER
            </div>
            <input
              type="text" maxLength={20}
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#1A1A3A] border border-white/10
                text-white font-bold outline-none focus:border-[#E94560]/50"
            />
          </div>

          {/* Title picker */}
          <div className="mb-5">
            <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-2">
              TITOLO
            </div>
            <div className="flex flex-wrap gap-2">
              {TITLE_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setTitle(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors
                    ${title === t
                      ? 'bg-[#E94560]/20 border-[#E94560]/50 text-[#E94560]'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar gallery */}
          <div className="mb-6">
            <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3">
              AVATAR
            </div>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_PRESETS.map(preset => {
                const selected = avatarId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setAvatarId(preset.id)}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all
                      ${selected ? 'ring-2 ring-[#E94560] scale-105' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <AvatarHex avatarId={preset.id} username={username} size={60} />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-xl font-bold tracking-wider text-white disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #E94560, #C9304A)',
              boxShadow: '0 4px 20px -4px rgba(233,69,96,0.5)',
            }}
          >
            {saving ? 'SALVATAGGIO…' : 'SALVA'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

### StatGrid & Helper RPCs

```sql
-- Helper RPC: aggregated battle stats for a user
CREATE OR REPLACE FUNCTION get_user_battle_stats(user_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total', COUNT(*),
    'wins',  COUNT(*) FILTER (WHERE (player1_user_id = user_id AND winner_side = 'p1')
                              OR (player2_user_id = user_id AND winner_side = 'p2')),
    'losses', COUNT(*) FILTER (WHERE (player1_user_id = user_id AND winner_side = 'p2')
                              OR (player2_user_id = user_id AND winner_side = 'p1')),
    'win_rate', CASE WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(
                  COUNT(*) FILTER (WHERE (player1_user_id = user_id AND winner_side = 'p1')
                                    OR (player2_user_id = user_id AND winner_side = 'p2'))
                  * 100.0 / COUNT(*), 1)
                END
  )
  FROM battles
  WHERE player1_user_id = user_id OR player2_user_id = user_id;
$$ LANGUAGE SQL STABLE;

-- Helper RPC: most-used winning combo
CREATE OR REPLACE FUNCTION get_favorite_combo(user_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object('name', c.name, 'wins', COUNT(*))
  FROM battles b
  JOIN combos c ON c.id = b.player1_combo_id OR c.id = b.player2_combo_id
  WHERE c.user_id = user_id
    AND ((b.player1_user_id = user_id AND b.winner_side = 'p1')
      OR (b.player2_user_id = user_id AND b.winner_side = 'p2'))
  GROUP BY c.name
  ORDER BY COUNT(*) DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;
```

```jsx
// components/account/StatGrid.jsx

import { Trophy, Package, Wrench, TrendingUp } from 'lucide-react';

export function StatGrid({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <StatTile label="Win Rate" value={`${stats.winRate}%`} sub={`${stats.wins}V / ${stats.losses}S`} icon={TrendingUp} color="#00D68F" />
      <StatTile label="Battaglie" value={stats.totalBattles} sub="Totali giocate"          icon={Trophy}     color="#F5A623" />
      <StatTile label="Parti"     value={stats.partsOwned}   sub="In collezione"           icon={Package}    color="#4361EE" />
      <StatTile label="Combo"     value={stats.combosCount}  sub="Creati da te"            icon={Wrench}     color="#E94560" />
    </div>
  );
}

function StatTile({ label, value, sub, icon: Icon, color }) {
  return (
    <div
      className="bg-[#12122A] rounded-xl p-3.5 relative overflow-hidden"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="text-[9px] font-extrabold tracking-[0.15em]" style={{ color }}>
          {label.toUpperCase()}
        </div>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="text-[26px] font-black text-white leading-none tabular-nums">
        {value}
      </div>
      <div className="text-[9px] text-white/35 mt-1.5 tracking-wider font-semibold uppercase">
        {sub}
      </div>
    </div>
  );
}
```

### AchievementsGrid

Shows all achievements — unlocked ones colored, locked ones grayed out:

```jsx
// components/account/AchievementsGrid.jsx

import * as LucideIcons from 'lucide-react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export function AchievementsGrid({ achievements }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {achievements.map((a, i) => {
        const Icon = LucideIcons[a.icon] ?? LucideIcons.Award;
        const unlocked = a.unlocked;

        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="relative aspect-square rounded-xl p-3 flex flex-col items-center justify-center text-center border"
            style={unlocked ? {
              background: `${a.color}10`,
              borderColor: `${a.color}40`,
              boxShadow: `0 0 16px -4px ${a.color}40`,
            } : {
              background: '#12122A',
              borderColor: 'rgba(255,255,255,0.05)',
            }}
          >
            {unlocked ? (
              <Icon size={22} style={{ color: a.color }} strokeWidth={2.2} />
            ) : (
              <Lock size={18} className="text-white/30" strokeWidth={2} />
            )}
            <div
              className={`text-[9px] font-extrabold tracking-wider mt-2 uppercase leading-tight ${
                unlocked ? 'text-white' : 'text-white/30'
              }`}
            >
              {a.name}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
```

Tap on any achievement to show a modal with full description + unlock date (for unlocked ones). Left as an exercise — it's straightforward with `onClick` + another `Modal` variant reusing the `EditProfileModal` pattern.

---

## 4. Implementation Order

Given the scope, suggested implementation order:

1. ✅ **Database migrations** — all SQL blocks from Section 1
2. ✅ **Seed achievements** — the INSERT INTO achievements block
3. 🛠 **BattlePage hub** — 3 format tiles + recent battles list
4. 🛠 **1v1 flow** — PlayerPicker → ComboPicker → OutcomePicker → save
5. 🛠 **Battle history page** — `/battle/history` listing all battles
6. 🛠 **AccountPage** — hero card + stats + achievements + edit modal
7. 🛠 **AvatarHex + EditProfileModal** — preset picker, save to profile
8. 🛠 **3v3 deck format** — extends 1v1, adds deck selection and round tracking
9. 🛠 **Tournament bracket** — setup + bracket view + per-match launcher
10. 🛠 **Tournament round robin** — standings table + per-match launcher

The 1v1 flow is the foundation for everything else — tournaments just orchestrate multiple 1v1 matches. Getting that one rock-solid makes the rest mostly composition work.

---

*End of Briefing — BeyManager X Battle & Account — April 2026*

-- ────────────────────────────────────────────────────
-- BEYMANAGER X: BATTLE & GAMIFICATION SYSTEM
-- ────────────────────────────────────────────────────

-- Pulizia tabelle esistenti per garantire il nuovo schema
DROP TRIGGER IF EXISTS trg_battle_xp ON battles;
DROP FUNCTION IF EXISTS award_battle_xp();
DROP FUNCTION IF EXISTS check_battle_achievements(UUID);
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS decks CASCADE;
DROP TABLE IF EXISTS battles CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;

-- ────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────

-- TOURNAMENTS
CREATE TABLE tournaments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  format       TEXT NOT NULL CHECK (format IN ('bracket', 'round_robin')),
  battle_type  TEXT NOT NULL CHECK (battle_type IN ('1v1', '3v3')),
  status       TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'completed')),
  participants JSONB NOT NULL DEFAULT '[]',
  structure    JSONB NOT NULL DEFAULT '[]',
  winner_user_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  winner_guest_name TEXT,
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- BATTLES
CREATE TABLE battles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format             TEXT NOT NULL CHECK (format IN ('1v1', '3v3', 'tournament')),
  tournament_id      UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player1_user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player1_guest_name TEXT,
  player2_user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player2_guest_name TEXT,
  player1_combo_id   UUID REFERENCES combos(id) ON DELETE SET NULL,
  player2_combo_id   UUID REFERENCES combos(id) ON DELETE SET NULL,
  winner_side        TEXT CHECK (winner_side IN ('p1', 'p2', 'draw')),
  win_type           TEXT CHECK (win_type IN ('burst', 'ko', 'spin_finish', 'xtreme', 'draw')),
  points_p1          INT DEFAULT 0,
  points_p2          INT DEFAULT 0,
  notes              TEXT,
  played_at          TIMESTAMPTZ DEFAULT NOW(),
  created_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CHECK (player1_user_id IS NOT NULL OR player1_guest_name IS NOT NULL),
  CHECK (player2_user_id IS NOT NULL OR player2_guest_name IS NOT NULL)
);

CREATE INDEX idx_battles_p1_user   ON battles(player1_user_id);
CREATE INDEX idx_battles_p2_user   ON battles(player2_user_id);
CREATE INDEX idx_battles_tournament ON battles(tournament_id);
CREATE INDEX idx_battles_played_at  ON battles(played_at DESC);

-- DECKS
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

-- PROFILE ADDITIONS
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Blader d''Elite';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT 'gold';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#F5A623';

-- ACHIEVEMENTS CATALOG
CREATE TABLE achievements (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL,
  icon         TEXT NOT NULL,
  color        TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('battle', 'collection', 'combo', 'special')),
  threshold    INT NOT NULL DEFAULT 1,
  sort_order   INT NOT NULL DEFAULT 0
);

-- USER ACHIEVEMENTS TRACKER
CREATE TABLE user_achievements (
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- ────────────────────────────────────────────────────
-- 2. SEED DATA
-- ────────────────────────────────────────────────────

INSERT INTO achievements (id, name, description, icon, color, category, threshold, sort_order) VALUES
  ('first_battle',   'First Blood',      'Registra la tua prima battaglia',       'Swords',    '#E94560', 'battle',     1,   10),
  ('battle_10',      'Gladiatore',       'Vinci 10 battaglie',                     'Shield',    '#E94560', 'battle',     10,  20),
  ('battle_50',      'Campione',         'Vinci 50 battaglie',                     'Trophy',    '#F5A623', 'battle',     50,  30),
  ('battle_100',     'Leggenda',         'Vinci 100 battaglie',                    'Crown',     '#F5A623', 'battle',     100, 40),
  ('streak_3',       'Hat-Trick',        'Vinci 3 battaglie consecutive',          'Flame',     '#E94560', 'battle',     3,   50),
  ('streak_5',       'Invincibile',      'Vinci 5 battaglie consecutive',          'Zap',       '#F5A623', 'battle',     5,   60),
  ('tournament_win', 'Re del Torneo',    'Vinci il tuo primo torneo',              'Award',     '#F5A623', 'battle',     1,   70),
  ('collection_10',  'Collezionista',    'Possiedi 10 parti',                      'Package',   '#4361EE', 'collection', 10,  110),
  ('collection_25',  'Appassionato',     'Possiedi 25 parti',                      'Package',   '#4361EE', 'collection', 25,  120),
  ('collection_50',  'Archivista',       'Possiedi 50 parti',                      'PackagePlus','#4361EE','collection', 50,  130),
  ('collection_100', 'Curatore',         'Possiedi 100 parti',                     'PackageCheck','#F5A623','collection',100, 140),
  ('combo_5',        'Forgiatore',       'Crea 5 combo diversi',                   'Wrench',    '#E94560', 'combo',      5,   210),
  ('combo_15',       'Stratega',         'Crea 15 combo diversi',                  'Hammer',    '#E94560', 'combo',      15,  220),
  ('combo_30',       'Maestro Builder',  'Crea 30 combo diversi',                  'Cog',       '#F5A623', 'combo',      30,  230),
  ('win_stamina',    'Re della Stamina', 'Vinci 20 battaglie con combo Stamina',  'Infinity',  '#00D68F', 'special',    20,  310),
  ('win_attack',     'Re dell''Attacco', 'Vinci 20 battaglie con combo Attack',   'Swords',     '#E94560', 'special',    20,  320),
  ('win_defense',    'Re della Difesa',  'Vinci 20 battaglie con combo Defense',  'Shield',    '#4361EE', 'special',    20,  330);

-- ────────────────────────────────────────────────────
-- 3. LOGIC (TRIGGERS & RPCs)
-- ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_battle_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  win_count INT;
BEGIN
  SELECT COUNT(*) INTO win_count
  FROM battles
  WHERE (player1_user_id = p_user_id AND winner_side = 'p1')
     OR (player2_user_id = p_user_id AND winner_side = 'p2');

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
    PERFORM check_battle_achievements(winner_id);
  END IF;
  IF loser_id IS NOT NULL THEN
    UPDATE profiles SET xp = xp + 20, updated_at = NOW() WHERE id = loser_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_battle_xp
  AFTER INSERT ON battles
  FOR EACH ROW EXECUTE FUNCTION award_battle_xp();

-- STATS RPCs
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

-- ────────────────────────────────────────────────────
-- 4. SECURITY (RLS)
-- ────────────────────────────────────────────────────

ALTER TABLE battles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements  ENABLE ROW LEVEL SECURITY;

CREATE POLICY battles_select ON battles FOR SELECT USING (true);
CREATE POLICY battles_insert ON battles FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY tournaments_select ON tournaments FOR SELECT USING (true);
CREATE POLICY tournaments_insert ON tournaments FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY tournaments_update ON tournaments FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY decks_all ON decks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY achievements_select ON achievements FOR SELECT USING (true);
CREATE POLICY user_achievements_select ON user_achievements FOR SELECT USING (true);

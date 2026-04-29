-- ─────────────────────────────────────────────────────────────────────────────
-- BEYMANAGER X — BATTLE SYSTEM V2 MIGRATION
-- Round Tracking, Deck Management & Advanced Stats
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. EXTEND BATTLES TABLE
ALTER TABLE battles ADD COLUMN IF NOT EXISTS point_target INT NOT NULL DEFAULT 4;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'setup'
  CHECK (status IN ('setup', 'deck_select', 'active', 'completed', 'cancelled'));

-- Deck usati nel match (per 3v3 e tornei)
ALTER TABLE battles ADD COLUMN IF NOT EXISTS p1_deck_id UUID REFERENCES decks(id) ON DELETE SET NULL;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS p2_deck_id UUID REFERENCES decks(id) ON DELETE SET NULL;

-- Tracking di chi ha creato e chi è admin del match
ALTER TABLE battles ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. EXTEND TOURNAMENTS TABLE
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_mode TEXT NOT NULL DEFAULT 'manual'
  CHECK (registration_mode IN ('open', 'manual'));

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS point_target INT NOT NULL DEFAULT 4;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_open BOOLEAN NOT NULL DEFAULT false;

-- 3. FINISH TYPES REFERENCE TABLE
CREATE TABLE IF NOT EXISTS finish_types (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  points INT NOT NULL,
  color  TEXT NOT NULL,
  icon   TEXT NOT NULL
);

-- Seed finish types
INSERT INTO finish_types (id, name, points, color, icon)
VALUES
  ('burst',       'Burst Finish',   2, '#E94560', 'Zap'),
  ('ko',          'KO Finish',      2, '#4361EE', 'Target'),
  ('xtreme',      'Xtreme Finish',  3, '#F5A623', 'Flame'),
  ('spin_finish', 'Spin Finish',    1, '#00D68F', 'RotateCcw'),
  ('draw',        'Draw',           0, '#6B7280', 'Minus')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  points = EXCLUDED.points,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon;

ALTER TABLE finish_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finish_types_select ON finish_types;
CREATE POLICY finish_types_select ON finish_types FOR SELECT USING (true);

-- 4. ROUNDS TABLE
CREATE TABLE IF NOT EXISTS rounds (
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

CREATE INDEX IF NOT EXISTS idx_rounds_battle   ON rounds(battle_id);
CREATE INDEX IF NOT EXISTS idx_rounds_combo_p1 ON rounds(p1_combo_id);
CREATE INDEX IF NOT EXISTS idx_rounds_combo_p2 ON rounds(p2_combo_id);
CREATE INDEX IF NOT EXISTS idx_rounds_finish   ON rounds(finish_type);
CREATE INDEX IF NOT EXISTS idx_rounds_winner   ON rounds(winner_side);

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rounds_select ON rounds;
CREATE POLICY rounds_select ON rounds FOR SELECT USING (true);

DROP POLICY IF EXISTS rounds_insert ON rounds;
CREATE POLICY rounds_insert ON rounds FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM battles b
    WHERE b.id = battle_id
    AND (b.player1_user_id = auth.uid()
      OR b.player2_user_id = auth.uid()
      OR b.admin_user_id = auth.uid()
      OR b.created_by = auth.uid())
  ));

DROP POLICY IF EXISTS rounds_update ON rounds;
CREATE POLICY rounds_update ON rounds FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM battles b
    WHERE b.id = battle_id
    AND (b.player1_user_id = auth.uid()
      OR b.player2_user_id = auth.uid()
      OR b.admin_user_id = auth.uid())
  ));

-- 5. TOURNAMENT REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deck_id         UUID REFERENCES decks(id) ON DELETE SET NULL,
  deck_config     JSONB,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  registered_at   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (tournament_id, user_id)
);

-- Ensure columns exist if table was created by previous migrations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tournament_registrations' AND COLUMN_NAME='deck_id') THEN
    ALTER TABLE tournament_registrations ADD COLUMN deck_id UUID REFERENCES decks(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tournament_registrations' AND COLUMN_NAME='registered_at') THEN
    ALTER TABLE tournament_registrations ADD COLUMN registered_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tourney_reg_tournament ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourney_reg_user       ON tournament_registrations(user_id);

ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tourney_reg_select ON tournament_registrations;
CREATE POLICY tourney_reg_select ON tournament_registrations FOR SELECT USING (true);

DROP POLICY IF EXISTS tourney_reg_insert ON tournament_registrations;
CREATE POLICY tourney_reg_insert ON tournament_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS tourney_reg_delete ON tournament_registrations;
CREATE POLICY tourney_reg_delete ON tournament_registrations FOR DELETE
  USING (auth.uid() = user_id);

-- 6. TRIGGER: AUTO-COMPLETE MATCH
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
      winner_side = 'p1',
      played_at = NOW()
    WHERE id = NEW.battle_id;
  ELSIF v_p2_pts >= v_battle.point_target THEN
    UPDATE battles SET
      status = 'completed',
      winner_side = 'p2',
      played_at = NOW()
    WHERE id = NEW.battle_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_completion ON rounds;
CREATE TRIGGER trg_check_completion
  AFTER INSERT ON rounds
  FOR EACH ROW EXECUTE FUNCTION check_match_completion();

-- 7. LEADERBOARD RPCs

-- Combo più vincente
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
        WHERE r.created_at >= p_since  AND p1_combo_id IS NOT NULL
      UNION ALL
      SELECT p2_combo_id FROM rounds r
        JOIN battles b ON b.id = r.battle_id
        WHERE r.created_at >= p_since  AND p2_combo_id IS NOT NULL
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

-- Combo con più finish specifici
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
    
  GROUP BY 1, 2
  HAVING CASE WHEN r.winner_side = 'p1' THEN r.p1_combo_id
              WHEN r.winner_side = 'p2' THEN r.p2_combo_id
         END IS NOT NULL
  ORDER BY finish_count DESC
  LIMIT p_limit;
$$ LANGUAGE SQL STABLE;

-- Utenti con più vittorie
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

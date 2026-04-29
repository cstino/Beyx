-- Aggiunta blade_id alla tabella rounds per statistiche più precise
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS p1_blade_id UUID REFERENCES blades(id);
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS p2_blade_id UUID REFERENCES blades(id);

-- Aggiornamento RPC Classifiche per BeyX (v4)
-- Usa blade_id diretto dal round per le immagini

DROP FUNCTION IF EXISTS leaderboard_top_players(timestamptz, integer);
DROP FUNCTION IF EXISTS leaderboard_top_combos(timestamptz, integer);
DROP FUNCTION IF EXISTS leaderboard_top_finish_combos(text, timestamptz, integer);

-- 1. Leaderboard Top Players
CREATE OR REPLACE FUNCTION leaderboard_top_players(
  p_since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  avatar_id TEXT,
  elo INT,
  placement_done BOOLEAN,
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
      p.placement_done,
      COUNT(*) AS total_matches,
      COUNT(*) FILTER (
        WHERE (b.player1_user_id = p.id AND b.winner_side = 'p1')
           OR (b.player2_user_id = p.id AND b.winner_side = 'p2')
      ) AS wins
    FROM profiles p
    JOIN battles b ON (b.player1_user_id = p.id OR b.player2_user_id = p.id)
    WHERE b.status = 'completed'
      AND b.played_at >= p_since
    GROUP BY p.id, p.username, p.avatar_id, p.elo, p.placement_done
  )
  SELECT
    user_id, username, avatar_id, elo, placement_done,
    wins, total_matches,
    ROUND(wins * 100.0 / NULLIF(total_matches, 0), 1) AS win_rate
  FROM player_matches
  ORDER BY wins DESC
  LIMIT p_limit;
$$ LANGUAGE SQL STABLE;

-- 2. Leaderboard Top Combos
CREATE OR REPLACE FUNCTION leaderboard_top_combos(
  p_since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  combo_id UUID,
  combo_name TEXT,
  blade_image_url TEXT,
  wins BIGINT,
  total_rounds BIGINT,
  win_rate NUMERIC
) AS $$
  WITH winning_combos AS (
    SELECT
      CASE WHEN r.winner_side = 'p1' THEN r.p1_combo_id ELSE r.p2_combo_id END AS combo_id,
      CASE WHEN r.winner_side = 'p1' THEN r.p1_blade_id ELSE r.p2_blade_id END AS blade_id,
      CASE WHEN r.winner_side = 'p1' THEN r.p1_combo_label ELSE r.p2_combo_label END AS combo_label
    FROM rounds r
    JOIN battles b ON b.id = r.battle_id
    WHERE r.created_at >= p_since
      AND r.winner_side IN ('p1', 'p2')
  ),
  combo_stats AS (
    SELECT
      combo_id,
      blade_id,
      combo_label AS combo_name,
      COUNT(*) AS wins
    FROM winning_combos
    GROUP BY 1, 2, 3
  ),
  combo_totals AS (
    SELECT
      combo_id,
      blade_id,
      COUNT(*) AS total_rounds
    FROM (
      SELECT p1_combo_id AS combo_id, p1_blade_id AS blade_id FROM rounds r
        JOIN battles b ON b.id = r.battle_id
        WHERE r.created_at >= p_since
      UNION ALL
      SELECT p2_combo_id AS combo_id, p2_blade_id AS blade_id FROM rounds r
        JOIN battles b ON b.id = r.battle_id
        WHERE r.created_at >= p_since
    ) t
    GROUP BY 1, 2
  )
  SELECT
    s.combo_id,
    s.combo_name,
    bl.image_url AS blade_image_url,
    s.wins,
    t.total_rounds,
    ROUND(s.wins * 100.0 / NULLIF(t.total_rounds, 0), 1) AS win_rate
  FROM combo_stats s
  JOIN combo_totals t ON (COALESCE(t.combo_id, '00000000-0000-0000-0000-000000000000') = COALESCE(s.combo_id, '00000000-0000-0000-0000-000000000000') AND COALESCE(t.blade_id, '00000000-0000-0000-0000-000000000000') = COALESCE(s.blade_id, '00000000-0000-0000-0000-000000000000'))
  LEFT JOIN blades bl ON bl.id = s.blade_id
  ORDER BY s.wins DESC
  LIMIT p_limit;
$$ LANGUAGE SQL STABLE;

-- 3. Leaderboard Top Finish Combos
CREATE OR REPLACE FUNCTION leaderboard_top_finish_combos(
  p_finish_type TEXT,
  p_since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  combo_id UUID,
  combo_name TEXT,
  blade_image_url TEXT,
  finish_count BIGINT
) AS $$
  SELECT
    CASE WHEN r.winner_side = 'p1' THEN r.p1_combo_id ELSE r.p2_combo_id END AS combo_id,
    CASE WHEN r.winner_side = 'p1' THEN r.p1_combo_label ELSE r.p2_combo_label END AS combo_name,
    bl.image_url AS blade_image_url,
    COUNT(*) AS finish_count
  FROM rounds r
  JOIN battles b ON b.id = r.battle_id
  LEFT JOIN blades bl ON bl.id = (CASE WHEN r.winner_side = 'p1' THEN r.p1_blade_id ELSE r.p2_blade_id END)
  WHERE r.finish_type = p_finish_type
    AND r.created_at >= p_since
  GROUP BY 1, 2, 3
  ORDER BY 4 DESC
  LIMIT p_limit;
$$ LANGUAGE SQL STABLE;

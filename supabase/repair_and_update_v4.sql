-- Aggiornamento e Ripristino Classifiche BeyX (v4)
-- 1. Aggiunta colonne per statistiche blade dirette
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS p1_blade_id UUID REFERENCES blades(id);
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS p2_blade_id UUID REFERENCES blades(id);

-- 2. TENTATIVO DI RIPRISTINO DATI ESISTENTI
-- Cerchiamo di matchare il nome del Blade contenuto nel label con un Blade reale
UPDATE rounds r
SET p1_blade_id = b.id
FROM blades b
WHERE r.p1_blade_id IS NULL 
  AND r.p1_combo_label ILIKE b.name || '%';

UPDATE rounds r
SET p2_blade_id = b.id
FROM blades b
WHERE r.p2_blade_id IS NULL 
  AND r.p2_combo_label ILIKE b.name || '%';

-- 2.1 Back-populate p1_combo_id and p2_combo_id for old matches
-- This tries to link strings like "Wizard Rod 5-70 DB" to actual combo IDs
UPDATE rounds r
SET p1_combo_id = c.id
FROM combos c,
     blades b,
     ratchets ra,
     bits bi,
     battles bat
WHERE r.p1_combo_id IS NULL
  AND c.blade_id = b.id
  AND c.ratchet_id = ra.id
  AND c.bit_id = bi.id
  AND bat.id = r.battle_id
  AND c.user_id = bat.player1_user_id
  AND UPPER(r.p1_combo_label) = UPPER(b.name || ' ' || ra.name || ' ' || bi.name);

UPDATE rounds r
SET p2_combo_id = c.id
FROM combos c,
     blades b,
     ratchets ra,
     bits bi,
     battles bat
WHERE r.p2_combo_id IS NULL
  AND c.blade_id = b.id
  AND c.ratchet_id = ra.id
  AND c.bit_id = bi.id
  AND bat.id = r.battle_id
  AND c.user_id = bat.player2_user_id
  AND UPPER(r.p2_combo_label) = UPPER(b.name || ' ' || ra.name || ' ' || bi.name);

-- 3. Aggiornamento Funzioni RPC
DROP FUNCTION IF EXISTS leaderboard_top_players(timestamptz, integer);
DROP FUNCTION IF EXISTS leaderboard_top_players(timestamptz, integer, text);
DROP FUNCTION IF EXISTS leaderboard_top_combos(timestamptz, integer);
DROP FUNCTION IF EXISTS leaderboard_top_finish_combos(text, timestamptz, integer);

-- 1. Leaderboard Top Players (supporta ordinamento per ELO o WINS)
CREATE OR REPLACE FUNCTION leaderboard_top_players(
  p_since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_limit INT DEFAULT 10,
  p_sort_by TEXT DEFAULT 'wins'
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
  ORDER BY 
    CASE WHEN p_sort_by = 'elo' THEN elo::NUMERIC ELSE wins::NUMERIC END DESC
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

-- 4. Get specific Combo Performance
CREATE OR REPLACE FUNCTION get_combo_performance(p_combo_id UUID)
RETURNS TABLE(
  wins BIGINT,
  losses BIGINT,
  total_rounds BIGINT,
  win_rate NUMERIC,
  finish_breakdown JSON
) AS $$
  WITH stats AS (
    SELECT
      COUNT(*) FILTER (WHERE winner_side = (CASE WHEN p1_combo_id = p_combo_id THEN 'p1' ELSE 'p2' END)) AS wins,
      COUNT(*) FILTER (WHERE winner_side != (CASE WHEN p1_combo_id = p_combo_id THEN 'p1' ELSE 'p2' END) AND winner_side IN ('p1', 'p2')) AS losses,
      COUNT(*) AS total_rounds
    FROM rounds
    WHERE p1_combo_id = p_combo_id OR p2_combo_id = p_combo_id
  ),
  finishes AS (
    SELECT
      finish_type,
      COUNT(*) as count
    FROM rounds
    WHERE (p1_combo_id = p_combo_id AND winner_side = 'p1')
       OR (p2_combo_id = p_combo_id AND winner_side = 'p2')
    GROUP BY finish_type
  )
  SELECT
    s.wins,
    s.losses,
    s.total_rounds,
    ROUND(s.wins * 100.0 / NULLIF(s.total_rounds, 0), 1) AS win_rate,
    COALESCE((SELECT json_object_agg(finish_type, count) FROM finishes), '{}'::json) AS finish_breakdown
  FROM stats s;
$$ LANGUAGE SQL STABLE;

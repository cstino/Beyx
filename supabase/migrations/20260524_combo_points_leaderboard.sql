-- RPC per classifica TOP a punti: somma pesata di vittorie e sconfitte per tipo finish
DROP FUNCTION IF EXISTS combo_points_leaderboard(integer, text);
CREATE OR REPLACE FUNCTION combo_points_leaderboard(
  p_min_battles INT DEFAULT 5,
  p_blade_type TEXT DEFAULT NULL
)
RETURNS TABLE(
  combo_name TEXT,
  blade_image_url TEXT,
  blade_name TEXT,
  blade_type TEXT,
  wins BIGINT,
  losses BIGINT,
  draws BIGINT,
  total_rounds BIGINT,
  win_rate NUMERIC,
  points BIGINT,
  extreme_wins BIGINT,
  ko_wins BIGINT,
  burst_wins BIGINT,
  spin_wins BIGINT,
  extreme_losses BIGINT,
  ko_losses BIGINT,
  burst_losses BIGINT,
  spin_losses BIGINT
) AS $$
  WITH all_rounds AS (
    SELECT
      r.p1_combo_label, r.p2_combo_label,
      r.p1_blade_id, r.p2_blade_id,
      r.winner_side,
      r.finish_type
    FROM rounds r
    JOIN battles b ON b.id = r.battle_id
    WHERE r.winner_side IS NOT NULL
  ),
  all_entries AS (
    SELECT p1_combo_label AS combo_label, p1_blade_id AS blade_id,
           CASE WHEN winner_side = 'p1' THEN 'win' WHEN winner_side = 'p2' THEN 'loss' WHEN winner_side = 'draw' THEN 'draw' END AS result,
           finish_type
    FROM all_rounds WHERE p1_combo_label IS NOT NULL
    UNION ALL
    SELECT p2_combo_label AS combo_label, p2_blade_id AS blade_id,
           CASE WHEN winner_side = 'p2' THEN 'win' WHEN winner_side = 'p1' THEN 'loss' WHEN winner_side = 'draw' THEN 'draw' END AS result,
           finish_type
    FROM all_rounds WHERE p2_combo_label IS NOT NULL
  ),
  stats AS (
    SELECT
      combo_label, blade_id,
      COUNT(*) AS total_rounds,
      COUNT(*) FILTER (WHERE result = 'win') AS wins,
      COUNT(*) FILTER (WHERE result = 'loss') AS losses,
      COUNT(*) FILTER (WHERE result = 'draw') AS draws,
      COUNT(*) FILTER (WHERE result = 'win' AND finish_type = 'xtreme') AS extreme_wins,
      COUNT(*) FILTER (WHERE result = 'win' AND finish_type = 'ko') AS ko_wins,
      COUNT(*) FILTER (WHERE result = 'win' AND finish_type = 'burst') AS burst_wins,
      COUNT(*) FILTER (WHERE result = 'win' AND finish_type IN ('spin_finish', 'spin')) AS spin_wins,
      COUNT(*) FILTER (WHERE result = 'loss' AND finish_type = 'xtreme') AS extreme_losses,
      COUNT(*) FILTER (WHERE result = 'loss' AND finish_type = 'ko') AS ko_losses,
      COUNT(*) FILTER (WHERE result = 'loss' AND finish_type = 'burst') AS burst_losses,
      COUNT(*) FILTER (WHERE result = 'loss' AND finish_type IN ('spin_finish', 'spin')) AS spin_losses
    FROM all_entries
    WHERE result IS NOT NULL
    GROUP BY combo_label, blade_id
  )
  SELECT
    s.combo_label AS combo_name,
    COALESCE(
      CASE
        WHEN bl.active_variant_index IS NOT NULL
             AND bl.variants IS NOT NULL
             AND jsonb_array_length(bl.variants) > bl.active_variant_index
        THEN bl.variants -> bl.active_variant_index ->> 'image_url'
      END,
      bl.image_url
    ) AS blade_image_url,
    bl.name AS blade_name,
    bl.type AS blade_type,
    s.wins, s.losses, s.draws, s.total_rounds,
    ROUND(s.wins * 100.0 / NULLIF(s.total_rounds, 0), 1) AS win_rate,
    (s.extreme_wins * 3 + s.ko_wins * 2 + s.burst_wins * 2 + s.spin_wins * 1
     - s.extreme_losses * 3 - s.ko_losses * 2 - s.burst_losses * 2 - s.spin_losses * 1) AS points,
    s.extreme_wins, s.ko_wins, s.burst_wins, s.spin_wins,
    s.extreme_losses, s.ko_losses, s.burst_losses, s.spin_losses
  FROM stats s
  LEFT JOIN blades bl ON bl.id = s.blade_id
  WHERE s.total_rounds >= p_min_battles
    AND (p_blade_type IS NULL OR LOWER(bl.type) = LOWER(p_blade_type))
  ORDER BY points DESC;
$$ LANGUAGE SQL STABLE;

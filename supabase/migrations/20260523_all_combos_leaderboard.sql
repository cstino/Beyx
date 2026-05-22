-- RPC per classifica completa di tutte le combo (senza limit)
-- Usa combo_label (testo) e blade_id per raggruppare
DROP FUNCTION IF EXISTS all_combos_leaderboard(integer);
CREATE OR REPLACE FUNCTION all_combos_leaderboard(
  p_min_battles INT DEFAULT 5
)
RETURNS TABLE(
  combo_name TEXT,
  blade_image_url TEXT,
  blade_name TEXT,
  wins BIGINT,
  total_rounds BIGINT,
  win_rate NUMERIC,
  burst_count BIGINT,
  ko_count BIGINT,
  xtreme_count BIGINT,
  spin_finish_count BIGINT
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
  -- Unione di tutte le apparizioni come combo (p1 e p2)
  combo_entries AS (
    SELECT
      CASE WHEN winner_side = 'p1' THEN p1_combo_label ELSE p2_combo_label END AS combo_label,
      CASE WHEN winner_side = 'p1' THEN p1_blade_id ELSE p2_blade_id END AS blade_id,
      finish_type,
      winner_side
    FROM all_rounds
    WHERE winner_side IN ('p1', 'p2')
  ),
  -- Tutte le apparizioni (non solo vincenti) per total_rounds
  all_combo_entries AS (
    SELECT p1_combo_label AS combo_label, p1_blade_id AS blade_id FROM all_rounds WHERE p1_combo_label IS NOT NULL
    UNION ALL
    SELECT p2_combo_label AS combo_label, p2_blade_id AS blade_id FROM all_rounds WHERE p2_combo_label IS NOT NULL
  ),
  combo_totals AS (
    SELECT combo_label, blade_id, COUNT(*) AS total_rounds
    FROM all_combo_entries
    GROUP BY combo_label, blade_id
  ),
  combo_wins AS (
    SELECT combo_label, blade_id, COUNT(*) AS wins
    FROM combo_entries
    GROUP BY combo_label, blade_id
  ),
  combo_finishes AS (
    SELECT combo_label, blade_id,
      COUNT(*) FILTER (WHERE finish_type = 'burst') AS burst_count,
      COUNT(*) FILTER (WHERE finish_type = 'ko') AS ko_count,
      COUNT(*) FILTER (WHERE finish_type = 'xtreme') AS xtreme_count,
      COUNT(*) FILTER (WHERE finish_type IN ('spin_finish', 'spin')) AS spin_finish_count
    FROM combo_entries
    GROUP BY combo_label, blade_id
  )
  SELECT
    t.combo_label AS combo_name,
    bl.image_url AS blade_image_url,
    bl.name AS blade_name,
    COALESCE(w.wins, 0) AS wins,
    t.total_rounds,
    ROUND(COALESCE(w.wins, 0) * 100.0 / NULLIF(t.total_rounds, 0), 1) AS win_rate,
    COALESCE(f.burst_count, 0) AS burst_count,
    COALESCE(f.ko_count, 0) AS ko_count,
    COALESCE(f.xtreme_count, 0) AS xtreme_count,
    COALESCE(f.spin_finish_count, 0) AS spin_finish_count
  FROM combo_totals t
  LEFT JOIN combo_wins w ON w.combo_label = t.combo_label AND COALESCE(w.blade_id, '00000000-0000-0000-0000-000000000000') = COALESCE(t.blade_id, '00000000-0000-0000-0000-000000000000')
  LEFT JOIN combo_finishes f ON f.combo_label = t.combo_label AND COALESCE(f.blade_id, '00000000-0000-0000-0000-000000000000') = COALESCE(t.blade_id, '00000000-0000-0000-0000-000000000000')
  LEFT JOIN blades bl ON bl.id = t.blade_id
  WHERE t.total_rounds >= p_min_battles
  ORDER BY t.total_rounds DESC;
$$ LANGUAGE SQL STABLE;

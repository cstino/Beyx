CREATE OR REPLACE FUNCTION all_combos_leaderboard(
  p_min_battles INT DEFAULT 5
)
RETURNS TABLE(
  combo_id UUID,
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
    SELECT r.id, r.p1_combo_id, r.p2_combo_id, r.p1_blade_id, r.p2_blade_id,
      r.p1_combo_label, r.p2_combo_label, r.winner_side, r.finish_type
    FROM rounds r JOIN battles b ON b.id = r.battle_id
    WHERE r.winner_side IS NOT NULL
  ),
  combo_appearances AS (
    SELECT combo_id, blade_id, combo_name FROM (
      SELECT p1_combo_id AS combo_id, p1_blade_id AS blade_id, p1_combo_label AS combo_name FROM all_rounds WHERE p1_combo_id IS NOT NULL
      UNION ALL
      SELECT p2_combo_id AS combo_id, p2_blade_id AS blade_id, p2_combo_label AS combo_name FROM all_rounds WHERE p2_combo_id IS NOT NULL
    ) t GROUP BY combo_id, blade_id, combo_name
  ),
  combo_wins AS (
    SELECT CASE WHEN winner_side='p1' THEN p1_combo_id ELSE p2_combo_id END AS combo_id, COUNT(*) AS wins
    FROM all_rounds WHERE winner_side IN ('p1','p2') AND CASE WHEN winner_side='p1' THEN p1_combo_id ELSE p2_combo_id END IS NOT NULL
    GROUP BY combo_id
  ),
  combo_totals AS (
    SELECT combo_id, COUNT(*) AS total_rounds FROM (
      SELECT p1_combo_id AS combo_id FROM all_rounds WHERE p1_combo_id IS NOT NULL UNION ALL
      SELECT p2_combo_id AS combo_id FROM all_rounds WHERE p2_combo_id IS NOT NULL
    ) t GROUP BY combo_id
  ),
  combo_finishes AS (
    SELECT combo_id,
      COUNT(*) FILTER (WHERE finish_type='burst') AS burst_count,
      COUNT(*) FILTER (WHERE finish_type='ko') AS ko_count,
      COUNT(*) FILTER (WHERE finish_type='xtreme') AS xtreme_count,
      COUNT(*) FILTER (WHERE finish_type IN ('spin_finish','spin')) AS spin_finish_count
    FROM (SELECT CASE WHEN winner_side='p1' THEN p1_combo_id ELSE p2_combo_id END AS combo_id, finish_type
      FROM all_rounds WHERE winner_side IN ('p1','p2') AND CASE WHEN winner_side='p1' THEN p1_combo_id ELSE p2_combo_id END IS NOT NULL) t
    GROUP BY combo_id
  )
  SELECT a.combo_id, a.combo_name, bl.image_url AS blade_image_url, bl.name AS blade_name,
    COALESCE(w.wins,0) AS wins, t.total_rounds,
    ROUND(COALESCE(w.wins,0)*100.0/NULLIF(t.total_rounds,0),1) AS win_rate,
    COALESCE(f.burst_count,0) AS burst_count, COALESCE(f.ko_count,0) AS ko_count,
    COALESCE(f.xtreme_count,0) AS xtreme_count, COALESCE(f.spin_finish_count,0) AS spin_finish_count
  FROM combo_appearances a JOIN combo_totals t ON t.combo_id=a.combo_id
  LEFT JOIN combo_wins w ON w.combo_id=a.combo_id
  LEFT JOIN combo_finishes f ON f.combo_id=a.combo_id
  LEFT JOIN blades bl ON bl.id=a.blade_id
  WHERE t.total_rounds >= p_min_battles
  ORDER BY t.total_rounds DESC;
$$ LANGUAGE SQL STABLE;

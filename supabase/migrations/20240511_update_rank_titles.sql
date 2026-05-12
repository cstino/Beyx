-- UPDATE RANK TITLES TO BEYBLADE PRESTIGE THEME
CREATE OR REPLACE FUNCTION get_rank_from_elo(p_elo INT, p_placement_done BOOLEAN DEFAULT true)
RETURNS JSON AS $$
BEGIN
  RETURN CASE
    WHEN p_elo >= 2200 THEN json_build_object('rank', 'god',        'division', null, 'display', 'God Blader')
    WHEN p_elo >= 2000 THEN json_build_object('rank', 'legend',     'division', null, 'display', 'X-Legend')
    WHEN p_elo >= 1800 THEN json_build_object('rank', 'master',     'division', null, 'display', 'Master Blader')
    WHEN p_elo >= 1600 THEN json_build_object('rank', 'pro',        'division', null, 'display', 'Pro-League')
    WHEN p_elo >= 1400 THEN json_build_object('rank', 'elite',      'division', null, 'display', 'Elite Blader')
    WHEN p_elo >= 1200 THEN json_build_object('rank', 'challenger', 'division', null, 'display', 'X-Challenger')
    WHEN p_elo >= 1000 THEN json_build_object('rank', 'storm',      'division', null, 'display', 'Storm Blader')
    ELSE                    json_build_object('rank', 'rookie',     'division', null, 'display', 'Rookie')
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- UPDATE ACHIEVEMENTS NAMES
UPDATE achievements SET name = 'X-Challenger', description = 'Raggiungi il titolo X-Challenger (1200 ELO)' WHERE id = 'elo_silver';
UPDATE achievements SET name = 'Elite Blader', description = 'Raggiungi il titolo Elite Blader (1400 ELO)' WHERE id = 'elo_gold';
UPDATE achievements SET name = 'Pro-League', description = 'Raggiungi il titolo Pro-League (1600 ELO)' WHERE id = 'elo_platinum';
UPDATE achievements SET name = 'Master Blader', description = 'Raggiungi il titolo Master Blader (1800 ELO)' WHERE id = 'elo_diamond';
UPDATE achievements SET name = 'X-Legend', description = 'Raggiungi il titolo X-Legend (2000 ELO)' WHERE id = 'elo_champion';
UPDATE achievements SET name = 'God Blader', description = 'Raggiungi il titolo God Blader (2200 ELO)' WHERE id = 'elo_grandmaster';

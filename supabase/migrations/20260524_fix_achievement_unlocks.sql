-- ────────────────────────────────────────────────────
-- FIX: ACHIEVEMENT UNLOCKING SYSTEM
-- 16 su 31 obiettivi non avevano trigger di sblocco.
-- Questo migration risolve i più comuni + backfill retroattivo.
-- ────────────────────────────────────────────────────

-- 1. AGGIUNTA elo_first_win A check_elo_achievements
CREATE OR REPLACE FUNCTION check_elo_achievements(p_user_id UUID, p_new_elo INT)
RETURNS VOID AS $$
DECLARE
  win_count INT;
BEGIN
  SELECT COUNT(*) INTO win_count
  FROM battles
  WHERE ((player1_user_id = p_user_id AND winner_side = 'p1')
      OR (player2_user_id = p_user_id AND winner_side = 'p2'))
    AND is_official = true;

  IF win_count >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_first_win') ON CONFLICT DO NOTHING;
  END IF;

  IF p_new_elo >= 1200 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_silver') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 1400 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_gold') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 1600 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_platinum') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 1800 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_diamond') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 2000 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_champion') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 2200 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_grandmaster') ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. COLLECTION ACHIEVEMENTS (collection_10/25/50/100)
CREATE OR REPLACE FUNCTION check_collection_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  part_count INT;
BEGIN
  SELECT COUNT(*) INTO part_count
  FROM user_collections
  WHERE user_id = p_user_id;

  IF part_count >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'collection_10') ON CONFLICT DO NOTHING;
  END IF;
  IF part_count >= 25 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'collection_25') ON CONFLICT DO NOTHING;
  END IF;
  IF part_count >= 50 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'collection_50') ON CONFLICT DO NOTHING;
  END IF;
  IF part_count >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'collection_100') ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aggiorna il trigger collezione esistente per chiamare anche il check obiettivi
CREATE OR REPLACE FUNCTION award_collection_xp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET xp = xp + 10 WHERE id = NEW.user_id;
  PERFORM check_collection_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_collection_xp ON user_collections;
CREATE TRIGGER trg_collection_xp
  AFTER INSERT ON user_collections
  FOR EACH ROW EXECUTE FUNCTION award_collection_xp();

-- 3. COMBO ACHIEVEMENTS (combo_5/15/30)
CREATE OR REPLACE FUNCTION check_combo_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  combo_count INT;
BEGIN
  SELECT COUNT(*) INTO combo_count
  FROM combos
  WHERE user_id = p_user_id;

  IF combo_count >= 5 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'combo_5') ON CONFLICT DO NOTHING;
  END IF;
  IF combo_count >= 15 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'combo_15') ON CONFLICT DO NOTHING;
  END IF;
  IF combo_count >= 30 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'combo_30') ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trg_combo_achievements_fn()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_combo_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_combo_achievements ON combos;
CREATE TRIGGER trg_combo_achievements
  AFTER INSERT ON combos
  FOR EACH ROW EXECUTE FUNCTION trg_combo_achievements_fn();

-- 4. TOURNAMENT WIN ACHIEVEMENT (tournament_win)
CREATE OR REPLACE FUNCTION check_tournament_achievements()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.winner_user_id IS NOT NULL THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (NEW.winner_user_id, 'tournament_win') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_tournament_achievements ON tournaments;
CREATE TRIGGER trg_tournament_achievements
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
  EXECUTE FUNCTION check_tournament_achievements();

-- 5. BACKFILL RETROATTIVO: sblocca obiettivi per tutti gli utenti esistenti
CREATE OR REPLACE FUNCTION backfill_all_achievements()
RETURNS JSON AS $$
DECLARE
  r RECORD;
  total_users INT := 0;
  total_unlocks INT := 0;
BEGIN
  FOR r IN SELECT id, elo FROM profiles LOOP
    total_users := total_users + 1;

    -- Battle wins (first_battle, battle_10, 50, 100 + elo_first_win)
    PERFORM check_battle_achievements(r.id);

    -- ELO achievements (elo_first_win through elo_grandmaster)
    PERFORM check_elo_achievements(r.id, r.elo);

    -- Collection achievements
    PERFORM check_collection_achievements(r.id);

    -- Combo achievements
    PERFORM check_combo_achievements(r.id);
  END LOOP;

  SELECT COUNT(*) INTO total_unlocks FROM user_achievements;

  RETURN json_build_object(
    'users_checked', total_users,
    'total_unlocks', total_unlocks
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Esegue automaticamente il backfill alla creazione del migration
SELECT backfill_all_achievements();

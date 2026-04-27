-- ────────────────────────────────────────────────────
-- BEYMANAGER X: TOURNAMENT REGISTRATION SYSTEM (ROBUST VERSION)
-- ────────────────────────────────────────────────────

-- 1. Modifiche alla tabella tournaments (Silenzioso se già presenti)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tournaments' AND COLUMN_NAME='registration_open') THEN
    ALTER TABLE tournaments ADD COLUMN registration_open BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tournaments' AND COLUMN_NAME='max_participants') THEN
    ALTER TABLE tournaments ADD COLUMN max_participants INT DEFAULT 8;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tournaments' AND COLUMN_NAME='description') THEN
    ALTER TABLE tournaments ADD COLUMN description TEXT;
  END IF;
END $$;

-- 2. Tabella Registrazioni
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  deck_config     JSONB NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- 3. Row Level Security & Policies (Pulizia e Ricreazione)
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registrations_select_policy" ON tournament_registrations;
DROP POLICY IF EXISTS "registrations_insert_policy" ON tournament_registrations;
DROP POLICY IF EXISTS "registrations_update_policy" ON tournament_registrations;
DROP POLICY IF EXISTS "tournaments_delete_policy" ON tournaments;

CREATE POLICY "registrations_select_policy" ON tournament_registrations FOR SELECT USING (true);
CREATE POLICY "registrations_insert_policy" ON tournament_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "registrations_update_policy" ON tournament_registrations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tournaments 
    WHERE tournaments.id = tournament_registrations.tournament_id 
    AND tournaments.created_by = auth.uid()
  )
);
CREATE POLICY "tournaments_delete_policy" ON tournaments FOR DELETE USING (auth.uid() = created_by);

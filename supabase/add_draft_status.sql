-- Aggiunge i nuovi stati 'drafting' e 'draft_complete' alla tabella tournaments

DO $$ 
BEGIN
  -- Rimuove il vecchio constraint (che non include gli stati di draft)
  ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;

  -- Aggiunge il nuovo constraint con i nuovi stati
  ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check 
  CHECK (status IN ('setup', 'drafting', 'draft_complete', 'active', 'completed', 'cancelled'));

END $$;

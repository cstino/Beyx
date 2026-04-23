-- Esegui questo codice nel SQL Editor di Supabase per abilitare i Combo Stock
ALTER TABLE blades ADD COLUMN IF NOT EXISTS stock_ratchet TEXT;
ALTER TABLE blades ADD COLUMN IF NOT EXISTS stock_bit TEXT;

COMMENT ON COLUMN blades.stock_ratchet IS 'Il nome del Ratchet originale incluso nel set base';
COMMENT ON COLUMN blades.stock_bit IS 'Il nome del Bit originale incluso nel set base';

-- Aggiungi colonna tier alle tabelle ratchets e bits
-- Esegui questo nel SQL Editor di Supabase

ALTER TABLE ratchets ADD COLUMN IF NOT EXISTS tier text;
ALTER TABLE bits ADD COLUMN IF NOT EXISTS tier text;

-- Opzionale: Index per performance
CREATE INDEX IF NOT EXISTS idx_ratchets_tier ON ratchets(tier);
CREATE INDEX IF NOT EXISTS idx_bits_tier ON bits(tier);

COMMENT ON COLUMN ratchets.tier IS 'Competitive meta ranking (S, A, B, C)';
COMMENT ON COLUMN bits.tier IS 'Competitive meta ranking (S, A, B, C)';

-- 📦 BeyManager X - Release Codes Support
-- Aggiunge la colonna release_code a tutte le tabelle delle parti

ALTER TABLE public.blades ADD COLUMN IF NOT EXISTS release_code TEXT;
ALTER TABLE public.ratchets ADD COLUMN IF NOT EXISTS release_code TEXT;
ALTER TABLE public.bits ADD COLUMN IF NOT EXISTS release_code TEXT;

-- Indexing per ricerche veloci per codice prodotto
CREATE INDEX IF NOT EXISTS idx_blades_release ON public.blades(release_code);
CREATE INDEX IF NOT EXISTS idx_ratchets_release ON public.ratchets(release_code);
CREATE INDEX IF NOT EXISTS idx_bits_release ON public.bits(release_code);

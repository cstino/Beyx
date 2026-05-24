-- 🎨 BeyManager X - Variazioni di Colore
-- Aggiunge il supporto per varianti di colore alle parti e alla collezione

-- 1. Aggiunta colonna JSONB per salvare le varianti
ALTER TABLE public.blades ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ratchets ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.bits ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb;

-- Struttura prevista per il JSON 'variations':
-- [
--   {
--     "color_name": "Blue/Gold",
--     "hex_code": "#0055FF",
--     "release_code": "BX-00",
--     "image_url": "https://..."
--   }
-- ]

-- 2. Aggiunta colonna alle tabelle utente per tracciare QUALE variante si possiede/usa
-- Usiamo TEXT per salvare il release_code della variante (es. "BX-00"). 
-- Se è NULL, si intende il pezzo base.
ALTER TABLE public.user_collections ADD COLUMN IF NOT EXISTS variation_code TEXT;
ALTER TABLE public.combos ADD COLUMN IF NOT EXISTS blade_variation_code TEXT;
ALTER TABLE public.combos ADD COLUMN IF NOT EXISTS ratchet_variation_code TEXT;
ALTER TABLE public.combos ADD COLUMN IF NOT EXISTS bit_variation_code TEXT;

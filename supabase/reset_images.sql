-- 🛠️ BeyManager X - Schema Fix & Image Reset
-- Assicura che la colonna image_url esista ovunque e resetta gli URL

ALTER TABLE public.blades ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.ratchets ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.bits ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE public.blades SET image_url = NULL;
UPDATE public.ratchets SET image_url = NULL;
UPDATE public.bits SET image_url = NULL;

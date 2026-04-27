
-- AGGIUNTA SUPPORTO VARIANTI CONSOLIDATE
-- Permette di inserire più codici e immagini all'interno di un unico componente

ALTER TABLE public.blades ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.ratchets ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.bits ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::JSONB;

-- Commento: Questo permetterà di gestire versioni con colori diversi ma stesse stats nello stesso record.

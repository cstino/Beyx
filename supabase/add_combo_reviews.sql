-- 📋 BeyManager X - Expert Combo Evaluation System
-- Aggiunge il supporto per valutazioni personalizzate, note e rating da 1 a 10

ALTER TABLE public.combos 
ADD COLUMN IF NOT EXISTS user_stats JSONB DEFAULT '{"attack": 50, "defense": 50, "stamina": 50, "burst": 50, "mobility": 50}',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 10);

COMMENT ON COLUMN public.combos.user_stats IS 'Statistiche personalizzate inserite dal Blader (0-100)';
COMMENT ON COLUMN public.combos.notes IS 'Note tattiche e segreti della combinazione';
COMMENT ON COLUMN public.combos.user_rating IS 'Voto complessivo della combo secondo il Blader (1-10)';

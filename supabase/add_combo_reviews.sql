-- 📋 BeyManager X - Expert Combo Evaluation System
-- Aggiunge il supporto per valutazioni personalizzate, note e rating da 1 a 10

ALTER TABLE public.combos 
ADD COLUMN IF NOT EXISTS user_stats JSONB,
ADD COLUMN IF NOT EXISTS user_notes TEXT,
ADD COLUMN IF NOT EXISTS user_rating DECIMAL(3,1) CHECK (user_rating >= 1.0 AND user_rating <= 10.0);

COMMENT ON COLUMN public.combos.user_stats IS 'Statistiche personalizzate inserite dal Blader (0-100)';
COMMENT ON COLUMN public.combos.user_notes IS 'Note tattiche e segreti della combinazione';
COMMENT ON COLUMN public.combos.user_rating IS 'Voto complessivo della combo secondo il Blader (1.0-10.0)';

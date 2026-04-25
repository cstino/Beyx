-- 🛠️ BeyManager X - Database Patch
-- Aggiunge la colonna combo_type per la registrazione corretta delle combo
-- Esegui questo script nel SQL Editor di Supabase

ALTER TABLE public.combos 
ADD COLUMN IF NOT EXISTS combo_type TEXT DEFAULT 'Balance';

-- Opzionale: Popoliamo le combo esistenti se necessario
UPDATE public.combos SET combo_type = 'Balance' WHERE combo_type IS NULL;

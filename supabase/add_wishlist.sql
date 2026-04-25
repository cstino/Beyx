-- 📋 BeyManager X - Wishlist System
-- Aggiunge il supporto per la wishlist nella tabella delle collezioni utente

ALTER TABLE public.user_collections 
ADD COLUMN IF NOT EXISTS is_wishlist BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.user_collections.is_wishlist IS 'TRUE se il componente è in wishlist (desiderato), FALSE se è posseduto fisicamente';

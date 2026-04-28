-- Add deck config columns to battles table for ad-hoc deck selection (non-saved decks)
ALTER TABLE battles ADD COLUMN IF NOT EXISTS p1_deck_config JSONB;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS p2_deck_config JSONB;

-- Ensure is_official and point_target are present (safety check)
ALTER TABLE battles ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS point_target INT NOT NULL DEFAULT 4;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'setup'
  CHECK (status IN ('setup', 'pending', 'deck_select', 'active', 'completed', 'cancelled'));

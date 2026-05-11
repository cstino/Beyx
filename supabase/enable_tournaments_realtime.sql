-- ⚡️ Enable Realtime for Tournaments
-- Add the tournaments table to the Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;

-- Ensure Replica Identity is set to FULL for tournaments
-- This ensures that the full row payload is sent in the realtime event
ALTER TABLE tournaments REPLICA IDENTITY FULL;

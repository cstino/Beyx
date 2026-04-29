
-- ⚡️ Enable Realtime for Battle System
-- This script adds the necessary tables to the Supabase Realtime publication.

-- 1. Enable Realtime for the tables
ALTER PUBLICATION supabase_realtime ADD TABLE battles;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;

-- 2. Ensure Replica Identity is set to FULL for rounds 
-- (optional but recommended for complex sync)
ALTER TABLE rounds REPLICA IDENTITY FULL;
ALTER TABLE battles REPLICA IDENTITY FULL;

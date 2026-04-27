require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  // need a user token or use service role? The user was testing so the user made the request.
  // Wait, I can just use a local node script with anon key? No, RLS requires to be logged in. 
  // RLS: USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
}

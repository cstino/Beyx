const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('username, elo_matches').order('elo_matches', { ascending: false }).limit(10);
  if (error) console.error(error);
  else console.log(data);
}

check();

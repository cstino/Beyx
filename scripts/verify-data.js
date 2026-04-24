import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('blades')
    .select('*')
    .ilike('name', '%Wizard Rod%')
    .maybeSingle();
    
  if (error) console.error('❌ Errore:', error.message);
  else console.log('📊 Stato Wizard Rod:', data);
}
run();

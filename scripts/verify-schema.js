import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data: r } = await supabase.from('ratchets').select('*').limit(1);
  const { data: b } = await supabase.from('bits').select('*').limit(1);
  
  if (r && r.length > 0) {
    console.log('Ratchets Columns:', Object.keys(r[0]));
  }
  if (b && b.length > 0) {
    console.log('Bits Columns:', Object.keys(b[0]));
  }
}
run();

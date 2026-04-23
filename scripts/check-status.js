import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const tables = ['blades', 'ratchets', 'bits'];
  for (const table of tables) {
    const { data } = await supabase.from(table).select('name, image_url').limit(10);
    console.log(`\n📊 Status [${table}]:`);
    data.forEach(p => {
      console.log(`- ${p.name}: ${p.image_url?.includes('storage/v1/object/public') ? '✅ BUCKET' : p.image_url ? '⚠️ EXTERNAL' : '❌ MISSING'}`);
      if (p.image_url) console.log(`  URL: ${p.image_url}`);
    });
  }
}
run();

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const overrides = [
    { table: 'blades', name: 'Wyvern Gale', file: 'Hover_Wyvern.png' },
    { table: 'blades', name: 'Unicorn Sting', file: 'unicorn-delta.png' },
    { table: 'bits', name: 'Disc Ball', file: 'disk-ball.webp' }
  ];
  
  for (const o of overrides) {
    const url = `${SUPABASE_URL}/storage/v1/object/public/parts-images/${o.table}/${o.file}`;
    const { error } = await supabase.from(o.table).update({ image_url: url }).ilike('name', o.name);
    if (!error) {
      console.log(`✅ MANUALLY LINKED: ${o.name} -> ${o.file}`);
    } else {
      console.error(`❌ FAILED: ${o.name} -> ${error.message}`);
    }
  }
}
run();

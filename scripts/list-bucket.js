import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL.replace('/rest/v1/', ''), process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: blades } = await supabase.storage.from('parts-images').list('blades', { limit: 100 });
    const { data: ratchets } = await supabase.storage.from('parts-images').list('ratchets', { limit: 100 });
    const { data: bits } = await supabase.storage.from('parts-images').list('bits', { limit: 100 });

    console.log("BLADES:", blades.map(f => f.name).slice(0, 10).join(", "));
    console.log("RATCHETS:", ratchets.map(f => f.name).join(", "));
    console.log("BITS:", bits.map(f => f.name).slice(0, 10).join(", "));
}
run();

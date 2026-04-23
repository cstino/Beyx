import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL.replace('/rest/v1/', ''), process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: files } = await supabase.storage.from('parts-images').list('blades', { limit: 200 });
    console.log(`TOTAL FILES IN BLADES: ${files?.length}`);
    console.log(files?.map(f => f.name).join(", "));
}
run();

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL.replace('/rest/v1/', ''), process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: files } = await supabase.storage.from('parts-images').list('blades', { 
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
    });
    
    console.log("RECENT FILES IN BLADES:");
    files?.slice(0, 20).forEach(f => {
        console.log(`- ${f.name} (Created: ${f.created_at})`);
    });
}
run();

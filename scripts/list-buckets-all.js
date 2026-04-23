import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL.replace('/rest/v1/', ''), process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log("BUCKETS TROVATI:", buckets?.map(b => b.name).join(", "));
    
    for (const b of buckets || []) {
      const { data: files } = await supabase.storage.from(b.name).list('', { limit: 5 });
      console.log(`- Contenuto bucket [${b.name}]:`, files?.map(f => f.name).join(", "));
    }
}
run();

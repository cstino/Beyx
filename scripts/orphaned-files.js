import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const tables = ['blades', 'ratchets', 'bits'];
  console.log("📂 ANALISI FILE ORFANI NEL BUCKET\n");

  for (const t of tables) {
    const { data: storageFiles } = await supabase.storage.from('parts-images').list(t, { limit: 1000 });
    const { data: dbParts } = await supabase.from(t).select('image_url');
    const usedUrls = new Set(dbParts?.map(p => p.image_url) || []);
    
    const orphaned = storageFiles?.filter(f => {
      if (f.name === '.emptyFolderPlaceholder') return false;
      const url = `${SUPABASE_URL}/storage/v1/object/public/parts-images/${t}/${f.name}`;
      return !usedUrls.has(url);
    }) || [];
    
    if (orphaned.length > 0) {
      console.log(`❌ [${t.toUpperCase()}] File caricati ma NON collegati:`);
      console.log(orphaned.map(f => f.name).join(", "));
    } else {
      console.log(`✅ [${t.toUpperCase()}] Tutti i file sono collegati correttamente.`);
    }
    console.log("");
  }
}
run();

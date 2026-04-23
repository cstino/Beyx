import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET_NAME = 'parts-images';

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function cleanAndSync(table) {
  console.log(`\n🧹 Pulizia e Sincronizzazione: ${table}...`);
  
  const { data: storageFiles } = await supabase.storage.from(BUCKET_NAME).list(table, { limit: 1000 });
  const { data: dbParts } = await supabase.from(table).select('id, name, image_url');

  let cleaned = 0;
  let synced = 0;

  for (const part of dbParts) {
    const normalName = normalize(part.name);
    const match = storageFiles?.find(file => normalize(file.name.split('.')[0]) === normalName);
    
    if (match) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${table}/${match.name}`;
      if (part.image_url !== publicUrl) {
        await supabase.from(table).update({ image_url: publicUrl }).eq('id', part.id);
        synced++;
      }
    } else {
      // If it has an external URL (Fandom), RESET it
      if (part.image_url && !part.image_url.includes('supabase.co')) {
        await supabase.from(table).update({ image_url: null }).eq('id', part.id);
        cleaned++;
      }
    }
  }
  console.log(`✅ ${table}: ${synced} collegati, ${cleaned} link esterni rimossi.`);
}

async function run() {
  for (const t of ['blades', 'ratchets', 'bits']) {
    await cleanAndSync(t);
  }
}
run();

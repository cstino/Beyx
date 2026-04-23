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

async function prioritySync(table) {
  console.log(`\n🚀 Sincronizzazione Prioritaria: ${table}...`);
  
  const { data: storageFiles } = await supabase.storage.from(BUCKET_NAME).list(table, { limit: 1000 });
  const { data: dbParts } = await supabase.from(table).select('id, name');

  let updatedCount = 0;

  for (const part of dbParts) {
    const normalName = normalize(part.name);
    
    // Find all potential matches
    const matches = storageFiles?.filter(file => normalize(file.name.split('.')[0]) === normalName) || [];
    
    if (matches.length > 0) {
      // PRIORITY: 1. .png (User preference) | 2. Most recent
      const bestMatch = matches.sort((a, b) => {
        const aExt = a.name.split('.').pop().toLowerCase();
        const bExt = b.name.split('.').pop().toLowerCase();
        
        if (aExt === 'png' && bExt !== 'png') return -1;
        if (bExt === 'png' && aExt !== 'png') return 1;
        
        return new Date(b.created_at) - new Date(a.created_at);
      })[0];

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${table}/${bestMatch.name}`;
      
      const { error } = await supabase
        .from(table)
        .update({ image_url: publicUrl })
        .eq('id', part.id);
      
      if (!error) {
        console.log(`✅ ${part.name} -> ${bestMatch.name}`);
        updatedCount++;
      }
    }
  }
  console.log(`✨ ${table}: ${updatedCount} aggiornati.`);
}

async function run() {
  for (const t of ['blades', 'ratchets', 'bits']) {
    await prioritySync(t);
  }
}
run();

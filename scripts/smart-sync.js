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

async function syncTable(table) {
  console.log(`\n🔍 Scanning ${table}...`);
  
  // 1. Get all files from storage for this category
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(table, { limit: 1000 });

  if (storageError) {
    console.error(`❌ Error listing files for ${table}:`, storageError.message);
    return;
  }

  // 2. Get all parts from database for this category
  const { data: dbParts, error: dbError } = await supabase
    .from(table)
    .select('id, name, image_url');

  if (dbError) {
    console.error(`❌ Error fetching ${table} from DB:`, dbError.message);
    return;
  }

  let updatedCount = 0;

  for (const part of dbParts) {
    const normalName = normalize(part.name);
    
    // Find best match in storage files
    const match = storageFiles.find(file => {
      const normalFile = normalize(file.name.split('.')[0]);
      return normalFile === normalName || normalFile.includes(normalName) || normalName.includes(normalFile);
    });

    if (match) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${table}/${match.name}`;
      
      // Update DB if URL is missing or different
      if (part.image_url !== publicUrl) {
        const { error: updError } = await supabase
          .from(table)
          .update({ image_url: publicUrl })
          .eq('id', part.id);
        
        if (!updError) {
          console.log(`✅ MATCH: ${part.name} -> ${match.name}`);
          updatedCount++;
        }
      }
    } else {
      // console.warn(`❌ NO MATCH for: ${part.name}`);
    }
  }

  console.log(`✨ ${table}: ${updatedCount} records updated.`);
}

async function run() {
  const tables = ['blades', 'ratchets', 'bits'];
  for (const table of tables) {
    await syncTable(table);
  }
  console.log('\n🏁 Smart Sync finished!');
}

run();

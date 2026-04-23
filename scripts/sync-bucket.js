import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET_NAME = 'parts-images';

async function syncTable(table) {
  console.log(`\n📦 Sincronizzazione tabella: ${table}...`);
  const folder = table;

  // 1. List files in the bucket folder
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folder, { limit: 1000 });

  if (listError) {
    console.error(`❌ Errore nel listare i file di ${folder}: ${listError.message}`);
    return;
  }

  if (!files || files.length === 0) {
    console.log(`ℹ️ Nessun file trovato nella cartella ${folder}`);
    return;
  }

  console.log(`🔎 Trovate ${files.length} immagini in storage per ${folder}`);

  // Fetch all parts from DB once for this table
  const { data: dbParts, error: dbError } = await supabase
    .from(table)
    .select('id, name');

  if (dbError) {
    console.error(`❌ Errore nel recuperare dati dal database: ${dbError.message}`);
    return;
  }

  for (const file of files) {
    if (file.name === '.emptyFolderPlaceholder') continue;

    // Build the public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${folder}/${file.name}`;
    
    // Convention: fileName (minus extension) matching name.toLowerCase().replace(/\s+/g, '-')
    const slug = file.name.split('.')[0];
    
    const matchingPart = dbParts?.find(p => 
      p.name.toLowerCase().replace(/\s+/g, '-') === slug ||
      p.name.toLowerCase() === slug.replace(/-/g, ' ')
    );

    if (matchingPart) {
      const { error: updateError } = await supabase
        .from(table)
        .update({ image_url: publicUrl })
        .eq('id', matchingPart.id);

      if (updateError) {
        console.error(`❌ Errore aggiornamento ${matchingPart.name}: ${updateError.message}`);
      } else {
        console.log(`✅ Collegata immagine per: ${matchingPart.name}`);
      }
    } else {
      console.warn(`⚠️ Nessun match trovato per il file: ${file.name}`);
    }
  }
}

async function run() {
  const tables = ['blades', 'ratchets', 'bits'];
  for (const table of tables) {
    await syncTable(table);
  }
  console.log('\n🏁 Sincronizzazione completata!');
}

run();

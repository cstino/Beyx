import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL.replace('/rest/v1/', ''), process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('🏆 Assegnazione Tier Meta-Competitivi...');

  const tiers = {
    blades: {
      S: ['Wizard Rod', 'Phoenix Wing', 'Aero Pegasus', 'Tyranno Beat', 'Cobalt Dragoon'],
      A: ['Dran Sword', 'Shark Edge', 'Hells Chain', 'Leon Claw', 'Dran Buster', 'Unicorn Sting'],
      B: ['Knight Shield', 'Viper Tail', 'Rhino Horn', 'Leon Crest', 'Hells Hammer']
    },
    ratchets: {
      S: ['3-60', '5-60', '9-60'],
      A: ['5-70', '9-70', '4-60', '1-60'],
      B: ['3-80', '4-80', '5-80']
    },
    bits: {
      S: ['Ball', 'Orb', 'Disc Ball', 'Hexa', 'Glide', 'Rush'],
      A: ['Point', 'Flat', 'Low Flat', 'Taper', 'Low Rush'],
      B: ['Needle', 'High Needle', 'High Taper']
    }
  };

  for (const [table, mapping] of Object.entries(tiers)) {
    console.log(`\n--- Elaborazione tabella: ${table} ---`);
    for (const [tier, names] of Object.entries(mapping)) {
      for (const name of names) {
        const { data, error, count } = await supabase
          .from(table)
          .update({ tier })
          .ilike('name', `%${name}%`)
          .select();
        
        if (error) {
          console.error(`❌ Errore su ${name}:`, error.message);
        } else if (data && data.length > 0) {
          console.log(`✅ [${tier}] Match trovato per "${name}": aggiornati ${data.length} record.`);
        } else {
          console.warn(`⚠️  Nessun match per "${name}" in ${table}`);
        }
      }
    }
  }

  console.log('\n🏁 Classifica completata!');
}
run();

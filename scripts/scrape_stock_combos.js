import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const WIKI_API = 'https://beyblade.fandom.com/api.php';

async function getPartComposition(pageTitle) {
  try {
    const { data } = await axios.get(WIKI_API, {
      params: {
        action: 'parse',
        page: pageTitle,
        prop: 'text',
        format: 'json',
        formatversion: 2,
        origin: '*',
      },
    });

    const html = data?.parse?.text;
    if (!html) return null;

    const $ = cheerio.load(html);
    const result = {};

    // Strategia Super-Robusta: Cerca IN TUTTE LE TABELLE
    $('table').each((_, table) => {
      const $table = $(table);
      const rows = $table.find('tr');
      
      // La tabella deve contenere le parole chiave nelle th o td
      const fullText = $table.text().toLowerCase();
      if (!fullText.includes('ratchet') || !fullText.includes('bit')) return;

      rows.each((_, row) => {
        const $cells = $(row).find('th, td');
        if ($cells.length < 2) return;

        const label = $cells.eq(0).text().trim().toLowerCase();
        const value = $cells.eq(1).find('a').first().text().trim() || $cells.eq(1).text().trim();

        if (label.includes('ratchet')) result.ratchet = value;
        if (label.includes('bit')) result.bit = value;
      });

      if (result.ratchet && result.bit) return false; // Match trovato!
    });

    return result;
  } catch (error) {
    return null;
  }
}

async function run() {
  console.log('🚀 Ricerca Combo Stock (Sincronizzazione Totale)...');
  
  const { data: blades, error } = await supabase
    .from('blades')
    .select('id, name, release_code');

  if (error) return console.error('❌ Errore DB:', error.message);

  for (const blade of blades) {
      // Priorità 1: Nome completo + Code se esiste | Priorità 2: Solo Nome
      const queries = [
        blade.release_code ? `${blade.name} ${blade.release_code}` : null,
        blade.name,
        blade.release_code
      ].filter(Boolean);

      let found = false;

      for (const q of queries) {
        process.stdout.write(`🔍 [${q}] `);
        try {
          const searchRes = await axios.get(WIKI_API, {
            params: {
              action: 'query',
              list: 'search',
              srsearch: q,
              format: 'json',
              formatversion: 2,
            },
          });

          const results = searchRes.data?.query?.search || [];
          if (results.length === 0) {
            console.log('⚠️ Nessun risultato.');
            continue;
          }

          const pageTitle = results[0].title;
          const parts = await getPartComposition(pageTitle);
          
          if (parts && (parts.ratchet || parts.bit)) {
            await supabase.from('blades').update({
              stock_ratchet: parts.ratchet,
              stock_bit: parts.bit
            }).eq('id', blade.id);
            console.log(`✅ ${parts.ratchet} | ${parts.bit} (${pageTitle})`);
            found = true;
            break; 
          } else {
            console.log(`...`);
          }
        } catch (err) {
          console.log(`❌ Errore.`);
        }
      }
      
      if (!found) console.log('⚠️ Non identificato.');
      await new Promise(r => setTimeout(r, 600));
  }
  console.log('\n🏁 Sincronizzazione completata!');
}

run();

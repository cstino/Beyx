import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const WIKI_API = 'https://beyblade.fandom.com/api.php';

const SOURCE_MAP = {
  'lock chip':    'lock_chip_id',
  'lockchip':     'lock_chip_id',
  'main blade':   'main_blade_id',
  'mainblade':    'main_blade_id',
  'assist blade': 'assist_blade_id',
  'assistblade':  'assist_blade_id',
  'blade':        'blade_id',
  'ratchet':      'ratchet_id',
  'bit':          'bit_id',
};

async function getStockParts(pageTitle) {
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
    const $infobox = $('aside.portable-infobox').first();
    if (!$infobox.length) return null;

    const parts = {};
    const description = $('.mw-parser-output > p')
      .filter((_, p) => $(p).text().trim().length > 50)
      .first()
      .text()
      .trim();

    $infobox.find('[data-source]').each((_, el) => {
      const source = $(el).attr('data-source')?.toLowerCase().trim();
      const key = SOURCE_MAP[source];
      if (!key) return;

      const $value = $(el).find('.pi-data-value').first();
      const text = $value.find('a').first().text().trim() || $value.text().trim();
      
      parts[source] = text;
    });

    return { parts, description };
  } catch (error) {
    return null;
  }
}

async function lookupPartId(table, name) {
  if (!name) return null;
  // Cleanup name (e.g. "Disk Ball" -> "Disk Ball")
  const { data } = await supabase.from(table).select('id').ilike('name', name.trim()).maybeSingle();
  return data?.id || null;
}

async function searchAndScrape(query, blade) {
  const searchRes = await axios.get(WIKI_API, {
    params: { action: 'query', list: 'search', srsearch: query, format: 'json', formatversion: 2 },
  });

  const results = searchRes.data?.query?.search || [];
  
  // Filtro avanzato: evita liste e componenti singoli, e deve contenere il nome del Bey
  const candidates = results.filter(r => {
    const t = r.title.toLowerCase();
    const n = blade.name.toLowerCase();
    
    // Escludi componenti e liste
    if (/^(blade|bit|ratchet|lock chip|main blade|assist blade|list of)\s*[-–]/i.test(t)) return false;
    if (t.includes('list of')) return false;

    // Deve esserci un match parziale col nome (senza spazi per gestire i titoli della wiki)
    const nameNoSpaces = n.replace(/\s+/g, '');
    return t.includes(n) || t.includes(nameNoSpaces);
  });

  for (const candidate of candidates.slice(0, 3)) {
    const data = await getStockParts(candidate.title);
    if (data && data.parts && (data.parts.ratchet || data.parts.bit)) {
      return { data, pageTitle: candidate.title };
    }
  }
  return null;
}

async function run() {
  console.log('🚀 Sincronizzazione Smart-Retry (Wizard Rod Hunter)...');
  
  const { data: blades, error } = await supabase
    .from('blades')
    .select('id, name, release_code');

  if (error) return console.error('❌ Errore DB:', error.message);

  for (const blade of blades) {
      process.stdout.write(`🔍 [${blade.name}] `);
      
      try {
        // Tentativo 1: Codice Release
        let result = blade.release_code ? await searchAndScrape(blade.release_code, blade) : null;
        
        // Tentativo 2: Nome Blade (se il primo fallisce)
        if (!result) {
          result = await searchAndScrape(blade.name, blade);
        }

        if (result) {
          const { data, pageTitle } = result;
          const rId = await lookupPartId('ratchets', data.parts.ratchet);
          const bId = await lookupPartId('bits', data.parts.bit);

          await supabase.from('blades').update({
            stock_ratchet: data.parts.ratchet,
            stock_bit: data.parts.bit,
            description: data.description
          }).eq('id', blade.id);

          // Popolamento releases se la tabella esiste
          try {
            await supabase.from('beyblade_releases').upsert({
              product_code: blade.release_code || pageTitle,
              name: `${blade.name} ${data.parts.ratchet || ''}${data.parts.bit || ''}`.trim(),
              wiki_page: pageTitle,
              description: data.description,
              blade_id: blade.id,
              ratchet_id: rId,
              bit_id: bId
            }, { onConflict: 'product_code' });
          } catch (e) {
            // Se la tabella non esiste ancora, ignoriamo
          }

          console.log(`✅ ${data.parts.ratchet || '?'} | ${data.parts.bit || '?'} (${pageTitle})`);
        } else {
          console.log('⚠️ Non identificato.');
        }

      } catch (err) {
        console.log(`❌ Errore.`);
      }

      await new Promise(r => setTimeout(r, 600));
  }
  console.log('\n🏁 Sincronizzazione completata!');
}

run();

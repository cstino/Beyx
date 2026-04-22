import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_FILE = './supabase/parts_seed.json';
const WIKI_API_URL = 'https://beyblade.fandom.com/api.php';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function searchFandomImage(partName, partType) {
  try {
    // 1. Search for the most likely article
    const searchRes = await axios.get(WIKI_API_URL, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: `${partName} ${partType.slice(0, -1)}`,
        format: 'json',
        origin: '*'
      }
    });

    const searchResults = searchRes.data.query.search;
    if (!searchResults || searchResults.length === 0) return null;

    // 2. Get images from the first 2 results
    for (let i = 0; i < Math.min(2, searchResults.length); i++) {
        const pageTitle = searchResults[i].title;
        const imagesRes = await axios.get(WIKI_API_URL, {
          params: {
            action: 'query',
            titles: pageTitle,
            prop: 'images',
            format: 'json',
            origin: '*'
          }
        });

        const pages = imagesRes.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const images = pages[pageId].images;

        if (images && images.length > 0) {
            // HIGH PRIORITY: Official Renders (Blade_Name.png, etc)
            const cleanPartName = partName.replace(/\s+/g, '');
            const officialPatterns = [
              `Blade_${cleanPartName}.png`,
              `Main_Blade_-_${partName.replace(/\s+/g, '_')}.png`,
              `${cleanPartName}_Render.png`,
              `UX_${cleanPartName}.png`
            ];

            let candidate = images.find(img => 
                officialPatterns.some(p => img.title.toLowerCase().includes(p.toLowerCase()))
            );

            // SECONDARY: Any PNG that contains the part name and is NOT an anime screenshot
            if (!candidate) {
                candidate = images.find(img => 
                    img.title.toLowerCase().includes(cleanPartName.toLowerCase()) && 
                    img.title.toLowerCase().includes('.png') &&
                    !img.title.toLowerCase().includes('anime') &&
                    !img.title.toLowerCase().includes('screenshot')
                );
            }

            // FALLBACK: Just take the first one if we're desperate, but better null then bad
            if (!candidate) continue;

            // 3. Get the direct URL for this image
            const infoRes = await axios.get(WIKI_API_URL, {
                params: {
                    action: 'query',
                    titles: candidate.title,
                    prop: 'imageinfo',
                    iiprop: 'url',
                    format: 'json',
                    origin: '*'
                }
            });

            const infoPages = infoRes.data.query.pages;
            const infoPageId = Object.keys(infoPages)[0];
            const url = infoPages[infoPageId].imageinfo?.[0]?.url;

            if (url) return url;
        }
    }
    return null;
  } catch (error) {
    console.error(`Error searching image for ${partName}:`, error.message);
    return null;
  }
}

async function run() {
  console.log('🚀 Starting Database-Driven Image Scraper...');

  const tables = ['blades', 'ratchets', 'bits'];
  
  for (const table of tables) {
    console.log(`\n📦 Fetching all components from: ${table}...`);
    const { data: parts, error } = await supabase
      .from(table)
      .select('name')
      .is('image_url', null); // Only fetch those without an image

    if (error) {
      console.error(`❌ Error fetching ${table}: ${error.message}`);
      continue;
    }

    console.log(`📝 Found ${parts.length} items to update in ${table}`);

    for (const part of parts) {
      const { name } = part;
      console.log(`\n🔍 Processing: ${name} (${table})...`);

    // 1. Search for Image URL
    const imageUrl = await searchFandomImage(name, table);
    if (!imageUrl) {
      console.warn(`⚠️ No image found for ${name}`);
      continue;
    }

    console.log(`🔗 Found Wiki URL: ${imageUrl}`);

    try {
      // 2. Download Image
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      
      // Get correct content-type from headers
      const contentType = response.headers['content-type'] || 'image/png';
      const extension = contentType.split('/')[1] || 'png';

      // 3. Upload to Supabase
      const fileName = `${table}/${name.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('parts-images')
        .upload(fileName, buffer, {
          contentType: contentType,
          upsert: true
        });

      if (uploadError) {
        console.error(`❌ Upload error for ${name}: ${uploadError.message}`);
        continue;
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/parts-images/${fileName}`;
      console.log(`✅ Uploaded: ${publicUrl}`);

      // 4. Update Database
      const { error: dbError } = await supabase
        .from(table)
        .update({ image_url: publicUrl })
        .eq('name', name);

      if (dbError) {
        console.error(`❌ DB Update error: ${dbError.message}`);
      } else {
        console.log(`✨ Database updated!`);
      }

    } catch (error) {
      console.error(`❌ Process failed for ${name}:`, error.message);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n🏁 Scraper process finished!');
}

run();

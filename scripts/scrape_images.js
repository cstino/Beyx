import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Load credentials from .env
const supabaseUrl = process.env.VITE_SUPABASE_URL.replace('/rest/v1/', '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SEED_FILE = './supabase/parts_seed.json';
const WIKI_BASE_URL = 'https://beyblade.fandom.com/wiki/';

async function scrapeAndUpload() {
  console.log('🚀 Starting image scraping & upload process...');

  if (!fs.existsSync(SEED_FILE)) {
    console.error('❌ Seed file not found at', SEED_FILE);
    return;
  }

  const parts = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));

  for (const part of parts) {
    const { name, wiki_slug, table } = part;
    console.log(`\n🔍 Processing: ${name}...`);

    try {
      // 1. Scrape Wiki
      const wikiUrl = `${WIKI_BASE_URL}${wiki_slug}`;
      const { data: html } = await axios.get(wikiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(html);
      
      // Look for the main image in the infobox
      let imageUrl = $('.pi-image-thumbnail').attr('src');
      
      if (!imageUrl) {
        // Fallback for some pages
        imageUrl = $('.thumbimage').attr('src');
      }

      if (!imageUrl) {
        console.warn(`⚠️ No image found for ${name} at ${wikiUrl}`);
        continue;
      }

      // Clean URL (remove everything after .png or .webp to get original size if needed)
      imageUrl = imageUrl.split('/revision/')[0];

      console.log(`📸 Found image: ${imageUrl}`);

      // 2. Download Image
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const buffer = Buffer.from(response.data, 'binary');

      // 3. Upload to Supabase Storage
      const fileName = `${table}/${wiki_slug.toLowerCase().replace(/_/g, '-')}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('parts-images')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error(`❌ Upload error for ${name}:`, uploadError.message);
        continue;
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/parts-images/${fileName}`;
      console.log(`✅ Uploaded to: ${publicUrl}`);

      // 4. Update Database
      const { error: dbError } = await supabase
        .from(table)
        .update({ image_url: publicUrl })
        .eq('name', name);

      if (dbError) {
        console.error(`❌ DB Update error for ${name}:`, dbError.message);
      } else {
        console.log(`✨ Database updated for ${name}`);
      }

      // 5. Rate limiting as per PRD
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ Error processing ${name}:`, error.message);
    }
  }

  console.log('\n🏁 Process completed!');
}

scrapeAndUpload();

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('🚀 Mega-Update: Popolamento intelligente modificatori...');

  // 1. RATCHETS
  const { data: ratchets } = await supabase.from('ratchets').select('id, name, height');
  for (const r of ratchets) {
    let mods = {};
    const h = parseInt(r.height || r.name.split('-')[1]);
    
    if (h === 60) mods = {stamina: 1, defense: 1};
    else if (h === 70) mods = {attack: 1};
    else if (h === 80) mods = {attack: 1, burst_resistance: 1, stamina: -1};
    
    // Casi speciali rari
    if (r.name.includes('9-')) mods.burst_resistance = (mods.burst_resistance || 0) + 1;
    if (r.name.includes('1-')) mods.burst_resistance = (mods.burst_resistance || 0) - 1;

    await supabase.from('ratchets').update({ stat_modifiers: mods }).eq('id', r.id);
  }
  console.log('✅ Ratchets aggiornati.');

  // 2. BITS
  const { data: bits } = await supabase.from('bits').select('id, name, type');
  for (const b of bits) {
    let mods = {};
    const t = (b.type || '').toLowerCase();
    
    if (t.includes('attack')) {
      mods = {attack: 2, dash_performance: 2, stamina: -2, burst_resistance: 1};
    } else if (t.includes('defense')) {
      mods = {defense: 2, stamina: 1, attack: -1, dash_performance: -1};
    } else if (t.includes('stamina')) {
      mods = {stamina: 2, defense: 1, attack: -1, dash_performance: -1};
    } else if (t.includes('balance')) {
      mods = {attack: 1, dash_performance: 1, burst_resistance: 1};
    }

    // Speciali Gear
    if (b.name.includes('Gear')) {
      mods.dash_performance = (mods.dash_performance || 0) + 1;
      mods.stamina = (mods.stamina || 0) - 1;
    }

    await supabase.from('bits').update({ stat_modifiers: mods }).eq('id', b.id);
  }
  console.log('✅ Bits aggiornati.');
  console.log('\n🏁 Tutte le parti ora hanno statistiche intelligenti!');
}

run();

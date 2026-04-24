import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('⚖️ Applicazione Pesi e Modificatori (Claude Strategy)...');

  // 1. RATCHET WEIGHTS & MODIFIERS
  const ratchets = [
    { name: '3-60', weight: 6.4, mods: {defense: 1, stamina: 1, burst_resistance: -1} },
    { name: '4-60', weight: 6.6, mods: {burst_resistance: -1} },
    { name: '5-60', weight: 6.5, mods: {defense: 1, stamina: 1} },
    { name: '9-60', weight: 6.2, mods: {defense: 1, stamina: 1, burst_resistance: 1} },
    { name: '3-70', weight: 6.8, mods: {attack: 1} },
    { name: '4-70', weight: 7.0, mods: {} },
    { name: '5-70', weight: 6.9, mods: {stamina: 1} },
    { name: '3-80', weight: 7.2, mods: {attack: 1, defense: -1, stamina: -1, burst_resistance: 1} },
    { name: '5-80', weight: 7.3, mods: {attack: 1, stamina: -1, burst_resistance: 1} },
    { name: '9-80', weight: 7.0, mods: {burst_resistance: 2} }
  ];

  for (const r of ratchets) {
    await supabase.from('ratchets').update({ 
      weight: r.weight, 
      stat_modifiers: r.mods 
    }).eq('name', r.name);
    process.stdout.write('.');
  }

  // 2. BIT WEIGHTS & MODIFIERS
  const bits = [
    { name: 'Flat', weight: 2.0, mods: {attack: 2, defense: -1, stamina: -2, burst_resistance: 1, dash_performance: 2} },
    { name: 'Low Flat', weight: 1.8, mods: {attack: 2, defense: -2, stamina: -2, burst_resistance: 1, dash_performance: 2} },
    { name: 'Ball', weight: 2.2, mods: {attack: -1, stamina: 2, burst_resistance: -1, dash_performance: -1} },
    { name: 'Needle', weight: 2.0, mods: {attack: -1, defense: 2, stamina: 1, burst_resistance: -1, dash_performance: -1} },
    { name: 'Taper', weight: 2.0, mods: {attack: 1, burst_resistance: 1, dash_performance: 1} },
    { name: 'Point', weight: 2.3, mods: {stamina: 1, dash_performance: 1} },
    { name: 'Rush', weight: 2.1, mods: {attack: 2, defense: -1, stamina: -1, burst_resistance: 1, dash_performance: 2} },
    { name: 'Disk Ball', weight: 2.2, mods: {attack: -1, stamina: 2, burst_resistance: -1, dash_performance: -1} },
    { name: 'Accel', weight: 2.2, mods: {attack: 1, dash_performance: 1} },
    { name: 'Hexa', weight: 2.3, mods: {attack: -1, defense: 1, stamina: 1} }
  ];

  for (const b of bits) {
    await supabase.from('bits').update({ 
      weight: b.weight, 
      stat_modifiers: b.mods 
    }).eq('name', b.name);
    process.stdout.write('.');
  }

  console.log('\n✅ Database aggiornato con i pesi e i modificatori reali!');
}

run();

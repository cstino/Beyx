require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://orsqdxnqzsctebmyxjwl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Check if Pegasus Blast exists in blades
  const { data: blades, error: bladesErr } = await supabase
    .from('blades')
    .select('*')
    .ilike('name', '%Pegasus%');
  
  console.log('Blades with "Pegasus":', blades);
  if (bladesErr) console.error('blades error:', bladesErr);

  // Check if there are rounds matching Pegasus Blast or other blades
  const { data: roundsP1, error: rP1Err } = await supabase
    .from('rounds')
    .select('id, p1_combo_label, p2_combo_label, p1_blade_id, p2_blade_id')
    .limit(10);
  console.log('Sample rounds:', roundsP1);

  // Let's call the RPC
  const { data: rpcData, error: rpcErr } = await supabase.rpc('combo_points_leaderboard', {
    p_min_battles: 1
  });
  console.log('RPC top combos (min_battles=1):', rpcData ? rpcData.slice(0, 10) : null);
  if (rpcErr) console.error('RPC Error:', rpcErr);
}
run();

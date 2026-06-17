require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const rawUrl = process.env.VITE_SUPABASE_URL || 'https://orsqdxnqzsctebmyxjwl.supabase.co';
const supabaseUrl = rawUrl.split('/rest/v1')[0];
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const pegasusBlastId = 'd627facf-bc03-49f4-a773-b9649d0f7fcf';

  // Check rounds with Pegasus Blast
  const { data: roundsP1, error: err1 } = await supabase
    .from('rounds')
    .select('id, winner_side, finish_type')
    .eq('p1_blade_id', pegasusBlastId);

  const { data: roundsP2, error: err2 } = await supabase
    .from('rounds')
    .select('id, winner_side, finish_type')
    .eq('p2_blade_id', pegasusBlastId);

  console.log('Rounds with Pegasus Blast as P1:', roundsP1);
  console.log('Rounds with Pegasus Blast as P2:', roundsP2);
}
run();

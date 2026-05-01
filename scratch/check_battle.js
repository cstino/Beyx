
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkBattle() {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .eq('id', '48882b88-58d9-4400-bc81-51aae4e42bd2')
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Battle data:', JSON.stringify(data, null, 2));
  }
}

checkBattle();

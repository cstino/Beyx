
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpdate() {
  console.log('Testing update on battle 48882b88-58d9-4400-bc81-51aae4e42bd2...');
  
  const { data, error } = await supabase
    .from('battles')
    .update({
      status: 'active'
    })
    .eq('id', '48882b88-58d9-4400-bc81-51aae4e42bd2')
    .select();

  if (error) {
    console.error('Update Error:', error);
  } else {
    console.log('Update Result:', data);
    if (data.length === 0) {
      console.log('Update succeeded but 0 rows affected (RLS likely blocking).');
    }
  }
}

testUpdate();

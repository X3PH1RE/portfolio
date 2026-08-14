import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

console.log('Testing Supabase Client connection...');
console.log('URL:', url);
console.log('KEY:', key?.substring(0, 15) + '...');

const supabase = createClient(url, key);

async function testConnection() {
  const { data, error } = await supabase.from('sessions').select('*').limit(1);
  if (error) {
    console.log('Supabase Query Response Error:', error.message);
    if (error.code === 'PGRST301' || error.message.includes('relation') || error.message.includes('does not exist')) {
      console.log('-> Note: Table "sessions" does not exist yet in Supabase.');
    }
  } else {
    console.log('✅ Supabase connected successfully! Query returned:', data);
  }
}

testConnection();

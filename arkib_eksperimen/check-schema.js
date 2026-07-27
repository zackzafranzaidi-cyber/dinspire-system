require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkSchema() {
  const { data, error } = await supabase.from('customers').select('*').limit(1);
  console.log("Schema data:", data);
  // insert a null name to see if it fails
  const res = await supabase.from('customers').insert([{ name: null, phone: '0123456789', address: null, avatar_url: null, password_hash: '123' }]);
  console.log("Insert null name:", res.error);
  if(!res.error) await supabase.from('customers').delete().eq('phone', '0123456789');
}
checkSchema();

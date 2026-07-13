require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function alterTable() {
  // Try inserting a dummy user with password_hash
  const { data, error } = await supabase.from('customers').insert([{ name: 'Test', phone: '0100000000', password_hash: '123' }]).select();
  if (error) {
    console.error("Error inserting password_hash:", error.message);
  } else {
    console.log("Success! Column password_hash is accepted.", data);
    await supabase.from('customers').delete().eq('phone', '0100000000');
  }
}
alterTable();

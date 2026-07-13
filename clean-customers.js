require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function clean() {
  const { data, error } = await supabase.from('customers').delete().neq('phone', 'none');
  console.log("Delete error:", error);
  console.log("Delete data:", data);
}
clean();

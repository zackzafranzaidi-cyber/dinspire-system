require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function get() {
  const o = await supabase.from('owners').select('*').limit(1);
  const s = await supabase.from('staff').select('*').limit(1);
  console.log("Owner:", o.data);
  console.log("Staff:", s.data);
}
get();

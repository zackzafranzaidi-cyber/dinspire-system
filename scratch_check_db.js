require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  // We can't do ALTER TABLE directly via supabase-js client unless we use rpc.
  // We will check if the column exists by selecting it.
  const { data, error } = await supabase.from('staff').select('status_pekerja').limit(1);
  if (error) {
    console.log("Column likely does not exist yet. Error:", error.message);
  } else {
    console.log("Column status_pekerja exists.");
  }
}
run();

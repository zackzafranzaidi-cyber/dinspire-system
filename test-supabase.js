require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase.from('customers').select('*').limit(1);
  if (error) {
    console.error("Error querying customers:", error);
  } else {
    console.log("Customers schema keys:", data.length > 0 ? Object.keys(data[0]) : "No data");
  }
}
checkSchema();

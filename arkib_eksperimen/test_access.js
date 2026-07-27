require('dotenv').config();
const supabase = require('./config/db');

async function testAccess() {
  const { data, error } = await supabase.from('owners').select('*').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}

testAccess();

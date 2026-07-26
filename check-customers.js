require('dotenv').config();
const supabase = require('./config/db');

async function check() {
  const { data, error } = await supabase.from('customers').select('*');
  console.log("Customers in DB:");
  console.log(data);
  if (error) console.error("Error:", error);
}
check();

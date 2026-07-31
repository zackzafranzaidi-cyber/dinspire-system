require('dotenv').config();
const supabase = require('./config/db');

async function test() {
  try {
    const [ { data: customers, error: err1 }, { data: walkins, error: err2 } ] = await Promise.all([
      supabase.from("customers").select("username, no_phone"),
      supabase.from("walkin_records").select("nama_pelanggan, no_phone").not("no_phone", "is", null)
    ]);
    console.log('Err1:', err1);
    console.log('Err2:', err2);
    
    // Simulate what the route does:
    if (!customers && !walkins) {
       console.log("Both are null. Did it throw?");
    }
  } catch (err) {
    console.error('Promise.all threw:', err);
  }
}
test();

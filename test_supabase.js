require('dotenv').config();
const supabase = require('./config/db');

async function test() {
  const res1 = await supabase.from('customers').select('username, no_phone');
  console.log('Customers:', res1.error);
  const res2 = await supabase.from('walkin_records').select('nama_pelanggan, no_phone').not('no_phone', 'is', null);
  console.log('Walkins:', res2.error);
}
test();

require('dotenv').config();
const supabase = require('./config/db');

async function testInsert() {
  console.log("Cuba daftar...");
  const { error } = await supabase.from('customers').insert([
    {
      name: "Test",
      phone: "0199999999",
      address: "Test Address",
      password_hash: "hash"
    }
  ]);
  console.log("Ralat Pendaftaran:", error);
}
testInsert();

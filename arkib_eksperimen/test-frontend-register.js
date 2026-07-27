require('dotenv').config();
const supabase = require('./config/db');

async function test() {
  const avatar_url = "";
  const { error } = await supabase.from('customers').insert([
    {
      name: "Test Frontend",
      phone: "0198888888",
      address: "Test Address",
      avatar_url: avatar_url,
      password_hash: "hash"
    }
  ]);
  console.log("Insert Error:", error);
}
test();

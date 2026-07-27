require('dotenv').config();
const supabase = require('./config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  const phone = "01122334455";
  const password = "password123";
  const hash = await bcrypt.hash(password, 10);
  
  const { error } = await supabase.from('customers').upsert([
    {
      name: "Pelanggan Test",
      phone: phone,
      address: "No 1, Jalan Test",
      password_hash: hash
    }
  ], { onConflict: 'phone' });

  if (error) {
    console.error("Gagal cipta akaun ujian:", error);
  } else {
    console.log(`\n✅ Akaun ujian berjaya dicipta!`);
    console.log(`No Tel: ${phone}`);
    console.log(`Katalaluan: ${password}\n`);
  }
}
seed();

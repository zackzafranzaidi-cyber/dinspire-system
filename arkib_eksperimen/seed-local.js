require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/db');

async function seedData() {
  console.log("Memulakan proses kemasukan data (Seed) ke Local Database...");

  const password = "123";
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 1. Masukkan Owner
  console.log("Memasukkan rekod Owner...");
  const { error: ownerErr } = await supabase.from('owners').insert([
    { username: "owner_test", password_hash: passwordHash }
  ]);
  if (ownerErr) console.error("Ralat Owner:", ownerErr.message);

  // 2. Masukkan Admin
  console.log("Memasukkan rekod Admin...");
  const { error: adminErr } = await supabase.from('admins').insert([
    { username: "admin_test", password_hash: passwordHash }
  ]);
  if (adminErr) console.error("Ralat Admin:", adminErr.message);

  // 3. Masukkan Cawangan (Branch)
  console.log("Memasukkan rekod Cawangan...");
  const { error: branchErr } = await supabase.from('branches').insert([
    { id: "B1", nama_cawangan: "Dinspire Utama", lokasi: "Kuala Lumpur" }
  ]);
  if (branchErr) console.error("Ralat Branch:", branchErr.message);

  // 4. Masukkan Servis Haircut
  console.log("Memasukkan rekod Servis Potongan Rambut...");
  const { error: haircutErr } = await supabase.from('haircuts').insert([
    { kategori: "Walk-in", nama_potongan: "Classic Cut (Test)", harga: 20 },
    { kategori: "Booking", nama_potongan: "Premium Fade (Test)", harga: 35 }
  ]);
  if (haircutErr) console.error("Ralat Haircuts:", haircutErr.message);

  console.log("\n✅ Proses Seed Selesai!");
  console.log("==========================================");
  console.log("MAKLUMAT LOG MASUK UJIAN:");
  console.log("------------------------------------------");
  console.log("Portal Owner:");
  console.log("Username : owner_test");
  console.log("Password : 123");
  console.log("------------------------------------------");
  console.log("Portal Admin:");
  console.log("Username : admin_test");
  console.log("Password : 123");
  console.log("==========================================\n");
}

seedData();

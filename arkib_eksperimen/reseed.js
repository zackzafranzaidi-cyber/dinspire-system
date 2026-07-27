require('dotenv').config();
const supabase = require('./config/db');
const bcrypt = require('bcryptjs');

async function reseed() {
  const phone = "01122334455";
  const password = "password123";
  const hash = await bcrypt.hash(password, 10);
  
  console.log("Generated Hash:", hash);
  
  const { error } = await supabase.from('customers').update({ password_hash: hash }).eq('phone', phone);
  
  if (error) {
    console.error("Update Error:", error);
  } else {
    console.log("Updated DB with new hash");
    
    // verify immediately
    const { data: user } = await supabase.from('customers').select('*').eq('phone', phone).single();
    console.log("Retrieved Hash:", user.password_hash);
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log("Is Valid?", isValid);
  }
}
reseed();

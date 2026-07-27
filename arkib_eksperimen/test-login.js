require('dotenv').config();
const supabase = require('./config/db');
const bcrypt = require('bcryptjs');

async function testLogin() {
  const phone = "01122334455";
  const password = "password123";

  const { data: user, error } = await supabase.from("customers").select("*").eq("phone", phone).single();
  
  if (error) {
    console.error("DB Error:", error);
    return;
  }
  
  if (!user) {
    console.log("User not found!");
    return;
  }
  
  console.log("User found:", user.name);
  console.log("Hash in DB:", user.password_hash);
  
  const isValid = await bcrypt.compare(password, user.password_hash || "");
  console.log("Is Valid?", isValid);
}
testLogin();

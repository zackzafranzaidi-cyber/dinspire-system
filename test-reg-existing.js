const phone = "0194993445"; // The phone number from user's screenshot
const otp = "123456";
const password = "password123";

async function testReg() {
  const { createClient } = require('@supabase/supabase-js');
  require('dotenv').config();
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  
  await supabase.from('otps').upsert([{ phone, otp_code: otp, expires_at: new Date(Date.now() + 600000) }]);

  const res = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "awang",
      phone,
      address: "no17",
      avatar_url: "./Profile/10.png",
      otp,
      password
    })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", text);
}
testReg();

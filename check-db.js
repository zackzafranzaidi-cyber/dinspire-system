require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkDB() {
  const { data: custData, error: custErr } = await supabase.from('customers').select('*').limit(1);
  console.log("Customers fetch:", { data: custData, error: custErr });
  
  // To check if inserting works
  const dummyPhone = '0199999999';
  const dummyOtp = '123456';
  
  // 1. insert OTP
  const { error: otpErr } = await supabase.from('otps').upsert([{ phone: dummyPhone, otp_code: dummyOtp, expires_at: new Date(Date.now() + 600000) }]);
  console.log("OTP Insert Error:", otpErr);
  
  // 2. call /register (simulate HTTP or just DB call)
  // Let's do a direct DB insert to see if that fails
  const { data, error } = await supabase.from('customers').insert([{
    name: 'Test',
    phone: dummyPhone,
    address: 'Test Address',
    avatar_url: './Profile/1.png',
    password_hash: 'hashyhash'
  }]);
  
  console.log("Customer Insert Result:", { data, error });
  
  // Cleanup
  await supabase.from('customers').delete().eq('phone', dummyPhone);
  await supabase.from('otps').delete().eq('phone', dummyPhone);
}
checkDB();

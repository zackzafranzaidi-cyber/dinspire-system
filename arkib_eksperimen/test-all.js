require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const API_BASE = 'http://localhost:3000/api';
let customerToken = '';
let ownerToken = '';
let staffToken = '';
let testPhone = '01122334455';
let testPassword = 'password123';

let customerCookies = '';

async function req(method, endpoint, body = null, useCookies = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (useCookies && customerCookies) headers['Cookie'] = customerCookies;
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  
  const text = await res.text();
  let json = {};
  try { json = JSON.parse(text); } catch(e) {}
  
  // Extract Set-Cookie
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) customerCookies = setCookie;

  return { status: res.status, json, text };
}

async function runTests() {
  console.log("=== MEMULAKAN UJIAN MENYELURUH DIN-BARBERSHOP ===");

  // 1. SETUP CLEANUP
  await supabase.from('customers').delete().eq('phone', testPhone);
  await supabase.from('otps').delete().eq('phone', testPhone);

  // 2. REGISTER
  console.log("\\n--- MENGUJI PENDAFTARAN ---");
  await supabase.from('otps').upsert([{ phone: testPhone, otp_code: '123456', expires_at: new Date(Date.now() + 600000) }]);
  let reg = await req('POST', '/auth/register', {
    username: 'Test User', phone: testPhone, address: 'Test Addr', avatar_url: './Profile/1.png', otp: '123456', password: testPassword
  });
  console.log("Register:", reg.status, reg.json);

  // 3. LOGIN
  console.log("\\n--- MENGUJI LOG MASUK CUSTOMER ---");
  let login = await req('POST', '/auth/login', { phone: testPhone, password: testPassword });
  console.log("Login:", login.status, login.json.status);
  if(login.json.token) customerToken = login.json.token;

  // 4. BOOKING SERVICE
  console.log("\\n--- MENGUJI TEMPAHAN SERVIS ---");
  let book = await req('POST', '/bookings/', {
    booking_type: 'Haircuts',
    serviceId: 1, 
    branchId: 1, 
    date: '2027-01-01', 
    time: '14:00', 
    amount: 30
  }, true);
  console.log("Book Service:", book.status, book.json);

  // 5. BUY PRODUCT
  console.log("\\n--- MENGUJI PEMBELIAN PRODUK ---");
  let buy = await req('POST', '/bookings/products', {
    items: [{ id: 1, quantity: 1, price: 50 }],
    shippingMethod: 'Pickup',
    address: 'Test',
    phone: testPhone
  }, true);
  console.log("Buy Product:", buy.status, buy.json);

  // 6. STAFF LOGIN
  console.log("\\n--- MENGUJI LOG MASUK STAFF ---");
  let sLogin = await req('POST', '/auth/system-login', { username: 'staff1', password: 'password123' });
  console.log("Staff Login:", sLogin.status, sLogin.json.status || sLogin.text);

  // 7. OWNER LOGIN
  console.log("\\n--- MENGUJI LOG MASUK OWNER ---");
  let oLogin = await req('POST', '/auth/system-login', { username: 'zafran', password: 'password123' });
  console.log("Owner Login:", oLogin.status, oLogin.json.status || oLogin.text);
  if(oLogin.json.token) ownerToken = oLogin.json.token;

  // 8. OWNER DASHBOARD STATS
  if (ownerToken) {
    console.log("\\n--- MENGUJI DATA DASHBOARD OWNER ---");
    let stats = await req('GET', '/owner/dashboard-stats', null, ownerToken);
    console.log("Dashboard Stats:", stats.status, stats.json.status || stats.text);
  }

  console.log("\\n=== UJIAN SELESAI ===");
}
runTests();

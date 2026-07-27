const http = require('http');

async function run() {
  // 1. Login
  const loginData = JSON.stringify({ phone: "01122334455", password: "password123", remember: true });
  const loginReq = http.request({ hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) } }, res => {
    const cookie = res.headers['set-cookie'][0];
    
    // 2. Book
    const bookData = JSON.stringify({
      booking_type: "haircut",
      service_id: 1,
      staff_id: 1,
      branch_id: 1,
      booking_date: "2026-08-01",
      booking_time: "10:00",
      payment_method: "fpx"
    });
    
    const bookReq = http.request({ hostname: 'localhost', port: 3000, path: '/api/bookings', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bookData), 'Cookie': cookie } }, res2 => {
      console.log(`STATUS: ${res2.statusCode}`);
      res2.on('data', d => process.stdout.write(d));
    });
    bookReq.on('error', e => console.error(e));
    bookReq.write(bookData);
    bookReq.end();
  });
  
  loginReq.on('error', e => console.error(e));
  loginReq.write(loginData);
  loginReq.end();
}
run();

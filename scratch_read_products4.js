const fs = require('fs');
const js = fs.readFileSync('routes/bookings.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('const { data: productsDB } = await supabase'));
console.log(lines.slice(idx, idx + 150).join('\n'));

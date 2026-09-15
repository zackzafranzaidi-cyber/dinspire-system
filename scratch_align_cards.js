const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

html = html.replace(
  '<p class="text-[10px] text-gray-400 font-bold">Staff Payouts</p>',
  '<p class="text-[10px] text-gray-400 font-bold mt-1">Staff Payouts</p>'
);

html = html.replace(
  '<p class="text-[10px] text-purple-400 font-bold relative z-10">Available Balance</p>',
  '<p class="text-[10px] text-purple-400 font-bold relative z-10 mt-1">Available Balance</p>'
);

fs.writeFileSync('public/owner/index.html', html);
console.log("Added mt-1 to align remaining cards.");

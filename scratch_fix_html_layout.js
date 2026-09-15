const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const badHtml = '<div class="flex items-center gap-2 mt-1"><span id="val-orders-pct-container" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"><span id="val-orders-pct">-</span>>-</span><p class="text-[10px] text-purple-600 font-bold" id="val-walkin-booking">0 Walk-in / 0 Booking</p></div>';

const goodHtml = `<div class="flex flex-col gap-1.5 items-start mt-1">
                  <span id="val-orders-pct-container" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"><span id="val-orders-pct">-</span></span>
                  <p class="text-[9px] text-purple-600/80 font-bold leading-tight" id="val-walkin-booking">0 Walk-in / 0 Booking</p>
                </div>`;

if (html.includes(badHtml)) {
    html = html.replace(badHtml, goodHtml);
    fs.writeFileSync('public/owner/index.html', html);
    console.log("Fixed the bad HTML layout!");
} else {
    console.log("Could not find the bad HTML string to replace.");
}

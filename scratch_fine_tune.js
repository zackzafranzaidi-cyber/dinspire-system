const fs = require('fs');

// 1. Update CSS
let css = fs.readFileSync('public/css/index.css', 'utf8');

// segmented-control background
css = css.replace(/\.segmented-control\s*\{[\s\S]*?background-color:\s*#e5e5ea;/g, function(match) {
    return match.replace('#e5e5ea', 'var(--bg-input)');
});

// segmented-control slider background
css = css.replace(/\.segmented-control\s*\.slider\s*\{[\s\S]*?background-color:\s*var\(--bg-surface\);/g, function(match) {
    return match.replace('var(--bg-surface)', 'var(--btn-dark)');
});

// rgb-border-container background
css = css.replace(/\.rgb-border-container\s*\{[\s\S]*?background-color:\s*#e5e5ea;/g, function(match) {
    return match.replace('#e5e5ea', 'var(--border-color)');
});

// Add badge variables to :root
css = css.replace(/--text-price:\s*#D1D5DB;/, 
`--text-price: #D1D5DB;
  --badge-pending-bg: rgba(234, 179, 8, 0.15);
  --badge-pending-text: #FBBF24;
  --badge-selesai-bg: rgba(34, 197, 94, 0.15);
  --badge-selesai-text: #4ADE80;
  --badge-rejected-bg: rgba(239, 68, 68, 0.15);
  --badge-rejected-text: #F87171;`);

// Add badge classes at the end of the file
css += `
.badge-status {
  font-size: 10px;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 700;
  text-transform: uppercase;
}
.badge-pending {
  background: var(--badge-pending-bg);
  color: var(--badge-pending-text);
}
.badge-selesai {
  background: var(--badge-selesai-bg);
  color: var(--badge-selesai-text);
}
.badge-rejected {
  background: var(--badge-rejected-bg);
  color: var(--badge-rejected-text);
}
`;
fs.writeFileSync('public/css/index.css', css);

// 2. Update JS (badges)
let js = fs.readFileSync('public/js/index.js', 'utf8');
// For product orders
js = js.replace(/let badgeStyle = o\.status === "Pending"\s*\? "background:#FFF3CD; color:#856404;"\s*: o\.status === "Rejected"\s*\? "background:#FFF3E0; color:#E65100;"\s*: o\.status === "Shipped"\s*\? "background:#E3F2FD; color:#1565C0;"\s*: "background:#E8F5E9; color:#2E7D32;";/, 
`let badgeClass = o.status === "Pending" ? "badge-pending" : (o.status === "Rejected" ? "badge-rejected" : (o.status === "Shipped" ? "badge-pending" : "badge-selesai"));`);
js = js.replace(/<span style="\$\{badgeStyle\} padding:4px 10px; border-radius:10px; font-weight:700; font-size:10px;">\$\{o\.status\}<\/span>/g,
`<span class="badge-status \${badgeClass}">\${o.status}</span>`);

// For service bookings
js = js.replace(/let badgeStyleService = o\.status === "Pending"\s*\? "background:#FFF3CD; color:#856404;"\s*: o\.status === "Rejected" \|\| o\.status === "Batal"\s*\? "background:#FFF3E0; color:#E65100;"\s*: "background:#E8F5E9; color:#2E7D32;";/,
`let badgeClassService = o.status === "Pending" ? "badge-pending" : ((o.status === "Rejected" || o.status === "Batal") ? "badge-rejected" : "badge-selesai");`);
js = js.replace(/<span style="\$\{badgeStyleService\} padding:4px 10px; border-radius:10px; font-weight:700; font-size:10px;">\$\{o\.status\}<\/span>/g,
`<span class="badge-status \${badgeClassService}">\${o.status}</span>`);

fs.writeFileSync('public/js/index.js', js);

// 3. Update HTML (Profile buttons)
let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace(/style="background:\s*var\(--bg-main\);\s*color:\s*var\(--text-main\);\s*width:\s*100%;\s*box-shadow:\s*0\s*4px\s*12px\s*rgba\(0,0,0,0\.05\);\s*font-weight:\s*bold;\s*border:\s*1px\s*solid\s*var\(--border-color\);\s*border-radius:\s*12px;"/g,
  'style="background: var(--bg-input); color: var(--text-main); width: 100%; font-weight: bold; border: 1px solid var(--border-color); border-radius: 12px;"');

html = html.replace(/style="background:\s*var\(--bg-surface\);\s*color:\s*#ff2a2a;\s*width:\s*100%;\s*box-shadow:\s*0\s*4px\s*12px\s*rgba\(0,0,0,0\.08\);\s*font-weight:\s*bold;\s*border:\s*none;\s*border-radius:\s*12px;"/g,
  'style="background: var(--bg-input); color: #F87171; width: 100%; font-weight: bold; border: none; border-radius: 12px;"'); // Using slightly softer red F87171 for Dark Mode

// Bump cache
html = html.replace(/index\.css\?v=\d+/, "index.css?v=80");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=80");
fs.writeFileSync('public/customer/index.html', html);

console.log("Fine-tuned colors and badges.");

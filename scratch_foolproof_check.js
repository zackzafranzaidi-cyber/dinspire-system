const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// The real question: does switchView("home") call showGlobalLoader()?
// And does the 6-second foolproof hide the loader BEFORE fetchShopData finishes?
// If fetchShopData takes longer than 6s (cold start), loader hides but data isn't loaded yet

// Check the foolproof fallback in index.html
const html = fs.readFileSync('public/customer/index.html', 'utf8');
const foolproofIdx = html.indexOf('FOOLPROOF');
if (foolproofIdx > -1) {
  console.log('=== FOOLPROOF FALLBACK FOUND ===');
  console.log(html.substring(foolproofIdx - 200, foolproofIdx + 500));
} else {
  console.log('NO FOOLPROOF FALLBACK');
}

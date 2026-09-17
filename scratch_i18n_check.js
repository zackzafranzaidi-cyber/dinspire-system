// Simulate what the browser does step by step
const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// Check the i18n file for errors
const i18n = fs.readFileSync('public/customer/js/i18n-index.js', 'utf8');

// Try to parse it
try {
  eval(i18n);
  console.log('i18n-index.js: OK, no errors');
  console.log('i18n_index type:', typeof i18n_index);
  console.log('Keys:', Object.keys(i18n_index));
} catch (e) {
  console.log('i18n-index.js ERROR:', e.message);
}

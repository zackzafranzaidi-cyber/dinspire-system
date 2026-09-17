const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// Check if the DOMContentLoaded with fetchShopData is properly structured
const domIdx = js.indexOf('window.addEventListener("DOMContentLoaded", async () => {');
const endIdx = js.indexOf('hideGlobalLoader();\n});', domIdx);
console.log('DOMContentLoaded found at:', domIdx);
console.log('End found at:', endIdx);

// Check for the fetchShopData call inside it
const fetchIdx = js.indexOf('await fetchShopData();', domIdx);
console.log('fetchShopData call at:', fetchIdx);
console.log('Is inside DOMContentLoaded:', fetchIdx > domIdx && fetchIdx < endIdx);

// Check the hideGlobalLoader at the end
const hideIdx = js.indexOf('hideGlobalLoader();', fetchIdx);
console.log('hideGlobalLoader at:', hideIdx);

// Check for renderHomeReviews
const reviewsIdx = js.indexOf('renderHomeReviews();', fetchIdx);
console.log('renderHomeReviews at:', reviewsIdx);

// Critical: check if switchView("home") happens BEFORE fetchShopData
const switchIdx = js.indexOf('switchView("home")', domIdx);
console.log('switchView("home") at:', switchIdx);
console.log('switchView is BEFORE fetchShopData:', switchIdx < fetchIdx);

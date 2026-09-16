const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

css = css.replace(/\.checkout-bar-header, \.checkout-bar-items \{\s*display: none !important;\s*\}/, `@media (max-width: 767px) {
  .checkout-bar-header, .checkout-bar-items {
    display: none !important;
  }
}`);

fs.writeFileSync('public/css/index.css', css);
console.log("Fixed CSS display order for desktop cart items.");

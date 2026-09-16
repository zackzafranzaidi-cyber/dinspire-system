const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

css = css.replace(
  'text-transform: uppercase;',
  'text-transform: uppercase;\n  white-space: nowrap;'
);

fs.writeFileSync('public/css/index.css', css);
console.log("Added white-space nowrap to checkout-label.");

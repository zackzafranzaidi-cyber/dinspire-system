const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regexBar = /\.mobile-container\.tab-products-active \.checkout-bar \{([\s\S]*?)\}/;
css = css.replace(regexBar, '.mobile-container.tab-products-active .checkout-bar {$1  z-index: 1000 !important;\n    }');

fs.writeFileSync('public/css/index.css', css);
console.log("Added z-index: 1000 to checkout-bar.");

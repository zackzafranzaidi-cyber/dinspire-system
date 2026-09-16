const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

css = css.replace(/\.mobile-container:has\(#view-products\.active\)/g, '.mobile-container.tab-products-active');
css = css.replace(/\.mobile-container:not\(:has\(#view-products\.active\)\)/g, '.mobile-container:not(.tab-products-active)');

fs.writeFileSync('public/css/index.css', css);
console.log("Updated CSS to use standard classes.");

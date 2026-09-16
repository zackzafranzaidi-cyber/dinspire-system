const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const oldRule = `.view-section > :not(.header):not(.slider-viewport):not(.reviews-container):not(.category-section):not(.section-title):not(.section-header) {`;
const newRule = `.view-section > :not(.header):not(.slider-viewport):not(.reviews-container):not(.category-section):not(.section-title):not(.section-header):not(.search-container):not(.product-grid) {`;

if (css.includes(oldRule)) {
    css = css.replace(oldRule, newRule);
    fs.writeFileSync('public/css/index.css', css);
    console.log("Updated CSS rule successfully.");
} else {
    console.log("Could not find CSS rule.");
}

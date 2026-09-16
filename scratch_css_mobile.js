const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const baseInjection = `
.checkout-bar-header, .checkout-bar-items {
  display: none !important;
}
`;

css = css + baseInjection;
fs.writeFileSync('public/css/index.css', css);
console.log("Injected base CSS for mobile hiding.");

const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

css = css.replace(/#account-logged-out \{([\s\S]*?)\}/, '#account-logged-out, #account-logged-in {$1}');

fs.writeFileSync('public/css/index.css', css);
console.log("Updated both login and logged-in views.");

const fs = require('fs');

// Fix index.html icon-solid -> icon-full
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace(/class="icon-solid"/g, 'class="icon-full"');
fs.writeFileSync('public/index.html', html);

// Fix index.js string literal interpolations
let js = fs.readFileSync('public/js/index.js', 'utf8');

js = js.replace(/> \+ i18n_index\[currentLang\]\["services-btn-schedule"\] \+ <\/button>/g, '></button>');
js = js.replace(/> \+ i18n_index\[currentLang\]\["products-btn-add"\] \+ <\/button>/g, '></button>');
js = js.replace(/> \+ i18n_index\[currentLang\]\["cart-delete-btn"\] \+ <\/div>/g, '></div>');

fs.writeFileSync('public/js/index.js', js);
console.log("Fixed bugs part 2");

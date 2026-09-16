const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const rogueNavRegex = /\.bottom-nav\s*\{\s*padding-right:\s*calc\(max\(0px,\s*\(100%\s*-\s*400px\)\s*\/\s*2\)\s*\+\s*280px\)\s*!important;\s*\}/;

const matches = css.match(new RegExp(rogueNavRegex, 'g'));

if (matches && matches.length > 0) {
    // We only want to remove the first one, because the second one has a selector `.mobile-container.tab-products-active .bottom-nav` which matches the regex if we are not careful.
    // Wait, the regex strictly matches `.bottom-nav { ... }` so it won't match `.mobile-container... .bottom-nav { ... }` because of the `\.bottom-nav\s*\{`
    css = css.replace(rogueNavRegex, "");
    fs.writeFileSync('public/css/index.css', css);
    console.log("Removed rogue nav via regex");
} else {
    console.log("Could not find rogue nav via regex");
}

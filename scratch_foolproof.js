const fs = require('fs');
let js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// Safely handle undefined shopData in renderHomeReviews
js = js.replace(
    'function renderHomeReviews() {\n  let reviews = shopData.Reviews || [];',
    'function renderHomeReviews() {\n  if (!shopData) return;\n  let reviews = shopData.Reviews || [];'
);

// Safely handle undefined shopData in fetchShopData try block just in case
js = js.replace(
    'try {\n    let bOpts =',
    'try {\n    if (!shopData) return;\n    let bOpts ='
);

// Put a giant try catch around the whole load listener logic
const loadListenerStart = js.indexOf('window.addEventListener("load", async () => {');
const loadListenerEndStr = '  hideGlobalLoader();\n});';
const loadListenerEnd = js.indexOf(loadListenerEndStr, loadListenerStart) + loadListenerEndStr.length;

let loadBlock = js.substring(loadListenerStart, loadListenerEnd);
loadBlock = loadBlock.replace(
    'window.addEventListener("load", async () => {',
    'window.addEventListener("load", async () => {\n  try {'
);
loadBlock = loadBlock.replace(
    '  hideGlobalLoader();\n});',
    '  hideGlobalLoader();\n  } catch (globalErr) {\n    alert("Fatal Error: " + globalErr.message);\n    console.error(globalErr);\n    hideGlobalLoader();\n  }\n});'
);

js = js.substring(0, loadListenerStart) + loadBlock + js.substring(loadListenerEnd);

fs.writeFileSync('public/customer/js/customer.js', js);
console.log("Made customer.js foolproof and added global error alert!");

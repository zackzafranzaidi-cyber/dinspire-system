const fs = require('fs');
let js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

const regex = /window\.addEventListener\("load", async \(\) => \{/g;
js = js.replace(regex, `
async function initApp() {
`);

const endRegex = /  hideGlobalLoader\(\);\n  \} catch \(globalErr\) \{\n    alert\("Fatal Error: " \+ globalErr\.message\);\n    console\.error\(globalErr\);\n    hideGlobalLoader\(\);\n  \}\n\}\);/g;

js = js.replace(endRegex, `  hideGlobalLoader();
  } catch (globalErr) {
    alert("Fatal Error: " + globalErr.message);
    console.error(globalErr);
    hideGlobalLoader();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
`);

fs.writeFileSync('public/customer/js/customer.js', js);
console.log("Updated customer.js to use DOMContentLoaded/initApp instead of load!");

// Bump cache again
let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace(/\?v=(\d+)/g, (match, p1) => '?v=' + (parseInt(p1) + 1));
fs.writeFileSync('public/customer/index.html', html);

let sw = fs.readFileSync('public/customer/sw.js', 'utf8');
sw = sw.replace(/(CACHE_NAME\s*=\s*['"][\w-]+-v)(\d+)(['"])/, (match, p1, p2, p3) => p1 + (parseInt(p2) + 1) + p3);
fs.writeFileSync('public/customer/sw.js', sw);


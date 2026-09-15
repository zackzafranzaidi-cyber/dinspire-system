const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

// 1. Remove the dot from next to the name.
// First, find the definition of dotHtml
const oldDotDef = `let dotHtml = showDot ? \`<div id="wa-dot-\${c.phone}" class="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block ml-2 mb-0.5"></div>\` : '';`;
const newDotDef = `let dotHtml = showDot ? \`<div id="wa-dot-\${c.phone}" class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse border-2 border-white shadow-sm"></div>\` : '';`;

code = code.replace(oldDotDef, newDotDef);

// 2. Remove dotHtml from the name column
const oldRowHtml = `\${escapeHTML(c.name)} \${dotHtml}<br/>`;
const newRowHtml = `\${escapeHTML(c.name)}<br/>`;
code = code.replace(oldRowHtml, newRowHtml);

// 3. Add dotHtml to the button, and add 'relative' to the button classes
// The button is:
// <a href="${waLink}" target="_blank" onclick="window.markWaClicked('${c.phone}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs shadow-sm font-bold transition inline-flex items-center justify-center">
//   <i class="fab fa-whatsapp text-sm mr-1"></i> Jemput
// </a>
const oldBtnRegex = /<a href="\$\{waLink\}" target="_blank" onclick="window\.markWaClicked\('\$\{c\.phone\}'\)" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1\.5 rounded-lg text-xs shadow-sm font-bold transition inline-flex items-center justify-center">\s*<i class="fab fa-whatsapp text-sm mr-1"><\/i> Jemput\s*<\/a>/g;

const newBtn = `<a href="\${waLink}" target="_blank" onclick="window.markWaClicked('\${c.phone}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs shadow-sm font-bold transition inline-flex items-center justify-center relative">
            <i class="fab fa-whatsapp text-sm mr-1"></i> Jemput
            \${dotHtml}
          </a>`;

code = code.replace(oldBtnRegex, newBtn);

// 4. While we're at it, let's fix the sticky header issue for this table and other tables just in case, by adding z-10 to the sticky headers in owner.js
code = code.replace(/class="text-xs text-gray-500 bg-gray-200 sticky top-0 shadow-sm uppercase tracking-wider"/g, 'class="text-xs text-gray-500 bg-gray-200 sticky top-0 z-10 shadow-sm uppercase tracking-wider"');
code = code.replace(/class="text-xs text-gray-500 bg-gray-100 sticky top-0 shadow-sm uppercase tracking-wider"/g, 'class="text-xs text-gray-500 bg-gray-100 sticky top-0 z-10 shadow-sm uppercase tracking-wider"');

fs.writeFileSync('public/js/owner.js', code);
console.log("Updated owner.js!");

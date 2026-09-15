const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

// The line is: <img src="${currentImg}" class="w-full h-full object-cover" alt="Poster">
// We want to add absolute inset-0 to it.
code = code.replace(/<img src="\$\{currentImg\}" class="w-full h-full object-cover" alt="Poster">/g, '<img src="${currentImg}" class="absolute inset-0 w-full h-full object-cover" alt="Poster">');

// Also ensure overflow-hidden is on the wrapper
code = code.replace(/class="relative w-full bg-gray-50 border-b border-gray-100 group-hover:border-purple-100 transition-colors"/g, 'class="relative w-full bg-gray-50 border-b border-gray-100 group-hover:border-purple-100 transition-colors overflow-hidden"');

fs.writeFileSync('public/js/owner_cms.js', code);
console.log("Updated using regex!");

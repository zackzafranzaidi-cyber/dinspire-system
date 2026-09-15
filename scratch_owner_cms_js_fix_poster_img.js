const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

const oldImgContainer = `<div style="aspect-ratio: 2/1;" class="relative w-full bg-gray-50 border-b border-gray-100 group-hover:border-purple-100 transition-colors">
            <img src="\${currentImg}" class="w-full h-full object-cover" alt="Poster">`;

const newImgContainer = `<div style="aspect-ratio: 2/1;" class="relative w-full bg-gray-50 border-b border-gray-100 group-hover:border-purple-100 transition-colors overflow-hidden">
            <img src="\${currentImg}" class="absolute inset-0 w-full h-full object-cover" alt="Poster">`;

code = code.replace(oldImgContainer, newImgContainer);

fs.writeFileSync('public/js/owner_cms.js', code);
console.log("Updated!");

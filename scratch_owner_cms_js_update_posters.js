const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

code = code.replace(/16:9/g, '2:1');
code = code.replace(/aspect-video/g, 'aspect-[2/1]');
// In case Tailwind doesn't compile aspect-[2/1] dynamically (because it might be precompiled without it),
// let's add style="aspect-ratio: 2/1;" to ensure it always works.
code = code.replace(/class="relative w-full aspect-\[2\/1\] bg-gray-50/g, 'style="aspect-ratio: 2/1;" class="relative w-full bg-gray-50');
code = code.replace(/class="bg-purple-50\/30 rounded-3xl border-2 border-dashed border-purple-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 aspect-\[2\/1\] group"/g, 'style="aspect-ratio: 2/1;" class="bg-purple-50/30 rounded-3xl border-2 border-dashed border-purple-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 group"');

// And change the grid for posters to be wider!
code = code.replace(/grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/g, 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 max-w-5xl mx-auto');

fs.writeFileSync('public/js/owner_cms.js', code);

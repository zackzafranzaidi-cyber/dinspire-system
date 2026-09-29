const fs = require('fs');
let content = fs.readFileSync('routes/owner.js', 'utf8');

const regexDestruct = /\{ data: treatments \},\s*\] = await Promise\.all\(\[/;
content = content.replace(regexDestruct, '{ data: treatments },\n        { data: staffData }\n      ] = await Promise.all([');

fs.writeFileSync('routes/owner.js', content);
console.log("Fixed destructuring in owner.js");

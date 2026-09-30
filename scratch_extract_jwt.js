const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'temp_leveldb');

let result = new Set();
const files = fs.readdirSync(dir);
for (const file of files) {
    if (file.endsWith('.ldb') || file.endsWith('.log')) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        const matches = content.match(/eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g);
        if (matches) {
            matches.forEach(m => result.add(m));
        }
    }
}
fs.writeFileSync('all_jwts.txt', Array.from(result).join('\n'));
console.log("Found " + result.size + " JWTs");

const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'temp_leveldb');

let result = "";
const files = fs.readdirSync(dir);
for (const file of files) {
    if (file.endsWith('.ldb') || file.endsWith('.log')) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        const matches = content.match(/sb-[a-zA-Z0-9]+-auth-token.*?(?=\x00|sb-|$)/g);
        if (matches) {
            result += matches.join('\n') + '\n';
        }
        
        // Also check supabase.auth.token
        const matches2 = content.match(/supabase\.auth\.token.*?(?=\x00|sb-|$)/g);
        if (matches2) {
            result += matches2.join('\n') + '\n';
        }
    }
}
fs.writeFileSync('extracted_tokens.txt', result);
console.log("Tokens written to extracted_tokens.txt");
